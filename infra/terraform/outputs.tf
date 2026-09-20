output "cloud_run_url" {
  value       = google_cloud_run_service.lingolive_server.status[0].url
  description = "Cloud Run service URL"
}

output "cloud_run_service_name" {
  value       = google_cloud_run_service.lingolive_server.name
  description = "Cloud Run service name"
}

output "database_instance_name" {
  value       = google_sql_database_instance.lingolive_db.name
  description = "Cloud SQL instance name"
}

output "database_connection_name" {
  value       = google_sql_database_instance.lingolive_db.connection_name
  description = "Cloud SQL connection name (for Cloud SQL Proxy)"
}

output "database_private_ip" {
  value       = google_sql_database_instance.lingolive_db.private_ip_address
  sensitive   = true
  description = "Cloud SQL instance private IP address"
}

output "database_user" {
  value       = google_sql_user.lingolive_user.name
  description = "Database username"
}

output "database_name" {
  value       = google_sql_database.lingolive.name
  description = "Database name"
}

output "service_account_email" {
  value       = google_service_account.lingolive_app.email
  description = "Cloud Run service account email"
}

output "vpc_connector_id" {
  value       = google_vpc_access_connector.lingolive.id
  description = "VPC Connector ID for Cloud SQL access"
}

output "db_password_secret" {
  value       = google_secret_manager_secret.db_password.id
  sensitive   = true
  description = "Secret Manager secret ID for database password"
}
