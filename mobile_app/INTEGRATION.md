# Integração LingoLive Mobile

## Estrutura Técnica

A app mobile Flutter é completamente separada do projeto web (React + Express) mas compartilha:

- **Firebase Project**: `lingolive-ia-f5778` (mesma instância)
- **Authentication**: Firebase Auth (email/password)
- **Database**: Cloud Firestore (estrutura partilhada)
- **Storage**: Cloud Storage para média

## Setup Inicial (Desenvolvimento)

### 1. Configurar Firebase
```bash
# Instalar FlutterFire CLI
dart pub global activate flutterfire_cli

# Configurar Firebase para o projeto
cd mobile_app
flutterfire configure
```

Isto vai:
- Ler as credenciais do Firebase (google-services.json, GoogleService-Info.plist)
- Gerar `lib/firebase_options.dart` automáticamente
- Configurar plataformas (Android, iOS, Web)

### 2. Instalar Dependências
```bash
flutter pub get
```

### 3. Correr Localmente
```bash
flutter run
```

## Estrutura de Dados Esperada

A app mobile consome as mesmas coleções Firestore da web:

### `/users/{uid}`
- `email`, `role`, `status`, `onboardingCompleted`
- Espelha o perfil do utilizador da web

### `/courses/{courseId}`
- `title`, `language`, `level`, `modules[]`
- Estrutura de cursos partilhada

### `/enrollments/{uid}/courses/{courseId}`
- `progress`, `lastAccessed`, `completed`
- Rastreamento de progresso do utilizador

### `/ebooks/{ebookId}`
- `title`, `author`, `content`, `chapters[]`
- E-books criados na plataforma

## Backend Esperado

A app mobile pode chamar a mesma API Express (quando disponível):

```
GET  /api/user/:uid
GET  /api/courses
GET  /api/ebook/:id
GET  /api/ebook/marketplace
POST /api/ebook/purchase
POST /api/user/progress
```

**Nota**: Localmente, sem backend rodando, a app funciona apenas com Firebase Firestore direto.

## Deployment

### Fase 3 do Pipeline (GitHub Actions)
- Faz checkout do código
- Valida estrutura Flutter
- Compila APK (Android)
- Guarda artefacto

Para ativar compiles reais:
1. Instalar Flutter SDK no runner (já configurado)
2. Gerar certificados de assinatura
3. Guardar em GitHub Secrets

### Build Manual
```bash
# APK Android
flutter build apk --release

# iOS
flutter build ios --release

# Web (Progressive Web App)
flutter build web --release
```

## Debugging

### Logs
```bash
flutter logs
```

### Conectar Debugger
```bash
flutter attach
```

### Hot Reload / Hot Restart
- `r` = Hot Reload (mantém estado)
- `R` = Hot Restart (reinicia app)
- `q` = Sair

## Considerações de Segurança

- ✅ Firebase Auth garante autenticação segura
- ⚠️ Firebase keys na app são públicas (é normal em Flutter)
- ✅ Usar Firestore Security Rules para controlar acesso
- ✅ Não guardar tokens sensíveis — usar Firebase Auth gerido
- ✅ API Express backend adiciona camada de segurança quando necessária

## Próximos Passos

1. Completar Firebase setup com credenciais reais
2. Adicionar navegação entre screens com named routes
3. Integrar dados reais de Firestore
4. Adicionar notificações (Firebase Cloud Messaging)
5. Implementar lições/conteúdo educativo
6. Beta testing com utilizadores reais
