# CertificaAqui — Arquitetura

## Padrão Arquitetural

- MVC em camadas
- Separação de responsabilidades: models, controllers, services, routes, middlewares

## Organização de Pastas

- src/models: definição das entidades
- src/controllers: lógica de interface
- src/services: regras de negócio
- src/routes: endpoints REST
- src/middlewares: autenticação, RBAC, escopo

## Diagramas C4

### Context Diagram (Nível 1)

```mermaid
graph TD
  Usuario --> Sistema[CertificaAqui]
  Sistema --> Banco[(PostgreSQL)]
  Sistema --> Email[Serviço de Email]
```

### Container Diagram (Nível 2)

```mermaid
graph TD
  Web[Express Web Server] --> API[REST API]
  API --> DB[(PostgreSQL)]
  API --> Auth[JWT Auth]
  API --> Certificados[Certificados]
  API --> Eventos[Eventos]
  API --> Participantes[Participantes]
  API --> TiposCertificados[Tipos de Certificados]
```

### Component Diagram (Nível 3)

```mermaid
graph TD
  API --> Controllers
  Controllers --> Services
  Services --> Models
  Controllers --> Middlewares
  API --> Routes
```

## Acoplamento e Coesão

- Baixo acoplamento entre camadas
- Alta coesão nos módulos

## Dependências

- JWT para autenticação
- Docker para infraestrutura
