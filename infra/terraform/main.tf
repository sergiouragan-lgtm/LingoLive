terraform {
  required_version = ">= 1.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
  backend "gcs" {
    bucket = "lingolive-terraform-state"
    prefix = "lingolive-server"
  }
}

provider "google" {
  project = var.gcp_project_id
  region  = var.gcp_region
}

# Cloud SQL Instance (PostgreSQL 15)
resource "google_sql_database_instance" "lingolive_db" {
  name             = "lingolive-postgres-${var.environment}"
  database_version = "POSTGRES_15"
  region           = var.gcp_region
  deletion_protection = var.environment == "production"

  settings {
    tier              = var.db_instance_tier
    availability_type = var.environment == "production" ? "REGIONAL" : "ZONAL"
    
    backup_configuration {
      enabled  = true
      start_time = "02:00"
      transaction_log_retention_days = var.environment == "production" ? 7 : 1
      backup_location = var.gcp_region
    }

    ip_configuration {
      require_ssl  = true
      ipv4_enabled = false
      private_network = "projects/${var.gcp_project_id}/global/networks/default"
    }

    database_flags {
      name  = "max_connections"
      value = "200"
    }
    
    database_flags {
      name  = "log_statement"
      value = "all"
    }

    user_labels = {
      environment = var.environment
      application = "lingolive"
    }
  }

  depends_on = [google_service_networking_connection.private_vpc_connection]
}

resource "google_sql_database" "lingolive" {
  name     = "lingolive"
  instance = google_sql_database_instance.lingolive_db.name
}

resource "google_sql_user" "lingolive_user" {
  name     = "lingolive_app"
  instance = google_sql_database_instance.lingolive_db.name
  password = random_password.db_password.result
}

resource "random_password" "db_password" {
  length  = 32
  special = true
}

# VPC Peering for Cloud SQL
resource "google_service_networking_connection" "private_vpc_connection" {
  network                 = "default"
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = ["google-managed-services-default"]
}

# Cloud Run Service
resource "google_cloud_run_service" "lingolive_server" {
  name     = "lingolive-server-${var.environment}"
  location = var.gcp_region

  template {
    spec {
      service_account_name = google_service_account.lingolive_app.email

      containers {
        image = "gcr.io/${var.gcp_project_id}/lingolive-server:${var.image_tag}"

        env {
          name  = "NODE_ENV"
          value = var.environment
        }
        
        env {
          name  = "PORT"
          value = "8080"
        }

        env {
          name  = "DATABASE_URL"
          value = "postgresql://${google_sql_user.lingolive_user.name}:${random_password.db_password.result}@${google_sql_database_instance.lingolive_db.private_ip_address}:5432/${google_sql_database.lingolive.name}?sslmode=require"
        }

        resources {
          limits = {
            cpu    = var.cloud_run_cpu
            memory = var.cloud_run_memory
          }
        }
      }

      timeout_seconds       = 3600
      service_account_name  = google_service_account.lingolive_app.email
    }

    metadata {
      annotations = {
        "autoscaling.knative.dev/maxScale"       = var.cloud_run_max_scale
        "autoscaling.knative.dev/minScale"       = var.cloud_run_min_scale
        "run.googleapis.com/vpc-access-connector" = google_vpc_access_connector.lingolive.id
        "run.googleapis.com/vpc-access-egress"   = "all-traffic"
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }

  depends_on = [
    google_project_iam_member.cloud_run_invoker
  ]
}

# Service Account
resource "google_service_account" "lingolive_app" {
  account_id   = "lingolive-app-${var.environment}"
  display_name = "LingoLive App Service Account (${var.environment})"
}

# IAM: Cloud Run invoker (public access)
resource "google_cloud_run_service_iam_member" "public_invoker" {
  service  = google_cloud_run_service.lingolive_server.name
  location = google_cloud_run_service.lingolive_server.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# IAM: Cloud Run admin (for deployments)
resource "google_project_iam_member" "cloud_run_invoker" {
  project = var.gcp_project_id
  role    = "roles/run.invoker"
  member  = "serviceAccount:${google_service_account.lingolive_app.email}"
}

# VPC Connector for Cloud SQL access
resource "google_vpc_access_connector" "lingolive" {
  name          = "lingolive-connector-${var.environment}"
  region        = var.gcp_region
  ip_cidr_range = "10.8.0.0/28"
  network       = "default"

  depends_on = [google_service_networking_connection.private_vpc_connection]
}

# Secret Manager: Store DB password
resource "google_secret_manager_secret" "db_password" {
  secret_id = "lingolive-db-password-${var.environment}"

  replication {
    automatic = true
  }
}

resource "google_secret_manager_secret_version" "db_password" {
  secret      = google_secret_manager_secret.db_password.id
  secret_data = random_password.db_password.result
}

# Grant Cloud Run service account access to secrets
resource "google_secret_manager_secret_iam_member" "db_password_accessor" {
  secret_id = google_secret_manager_secret.db_password.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.lingolive_app.email}"
}
