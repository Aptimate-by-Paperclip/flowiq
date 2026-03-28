# FlowIQ Infrastructure

> **Architecture change (2026-03-28):** FlowIQ staging has moved from AWS ECS + RDS + ElastiCache + S3 to
> **Vercel-managed services**. The Terraform modules in `infra/` are archived and no longer used.
> See [Vercel managed services](#vercel-managed-services-staging) below for the current setup.

---

## Vercel managed services (staging)

All staging infrastructure is now provisioned through the [Vercel dashboard](https://vercel.com/caudellhenrys-projects/flowiq-web).

| Service | Provider | Status | Env vars set |
|---------|----------|--------|--------------|
| **Blob storage** | Vercel Blob | ✅ Provisioned (`flowiq-documents-staging`) | `BLOB_READ_WRITE_TOKEN` |
| **Postgres** | Vercel Postgres (Neon) | ⏳ Needs dashboard provisioning | `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `POSTGRES_*` |
| **KV / Redis** | Vercel KV (Upstash) | ⏳ Needs dashboard provisioning | `KV_URL`, `KV_REST_API_URL`, `KV_REST_API_TOKEN` |

### Provisioning Vercel Postgres

1. Go to **Vercel Dashboard → Storage → Create Database → Postgres**
2. Name: `flowiq-staging-db`, Region: `iad1` (Washington DC)
3. Connect to the `flowiq-web` project (Production + Preview environments)
4. Vercel auto-sets: `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `POSTGRES_URL`, `POSTGRES_HOST`, `POSTGRES_DATABASE`, `POSTGRES_USER`, `POSTGRES_PASSWORD`

After linking, run migrations:

```bash
cd packages/db
pnpm db:migrate
```

### Provisioning Vercel KV

1. Go to **Vercel Dashboard → Storage → Create Database → KV**
2. Name: `flowiq-staging-kv`, Region: `iad1`
3. Connect to the `flowiq-web` project (Production + Preview environments)
4. Vercel auto-sets: `KV_URL`, `KV_REST_API_URL`, `KV_REST_API_TOKEN`, `KV_REST_API_READ_ONLY_TOKEN`

### Blob storage

Already provisioned. Store ID: `store_q61ZHR2tEe27FYqQ`. Connected to `flowiq-web` on Production + Preview.
`BLOB_READ_WRITE_TOKEN` is set on the project.

---

## Archived: AWS Terraform (no longer used)

The Terraform modules below were written for an ECS-based architecture that was superseded before deployment.
They are kept for reference only. **Do not apply this Terraform against any AWS account without board approval.**

<details>
<summary>Terraform module structure (archived)</summary>

```
infra/
├── modules/
│   ├── vpc/          # VPC, subnets, NAT gateway, route tables
│   ├── ecs/          # ECS Fargate cluster, ALB, task definitions, services
│   ├── rds/          # RDS PostgreSQL instance
│   ├── redis/        # ElastiCache Redis cluster
│   ├── s3/           # S3 documents bucket
│   ├── ecr/          # ECR repositories (one per service)
│   └── iam/          # ECS task roles + GitHub Actions deploy role
└── environments/
    └── staging/      # Staging environment wiring
```

</details>
