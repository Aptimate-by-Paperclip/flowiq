# FlowIQ

Turborepo monorepo for FlowIQ — AI-powered business process optimisation for SMEs.

## Structure

```
apps/
  api/          — Node.js/Fastify REST API (port 3000)
  web/          — Next.js frontend (port 3001)
  ai-service/   — Python/FastAPI AI service (port 8000)
packages/
  db/           — Prisma client + migrations
  types/        — Shared TypeScript types
  config/       — Shared ESLint + tsconfig
infra/          — Terraform (AWS ECS Fargate, RDS, Redis, S3, ECR)
.github/
  workflows/
    ci.yml             — PR checks (lint, typecheck, test, build)
    deploy-staging.yml — Merge-to-main deploy pipeline
```

## Local development

```bash
# Install dependencies
pnpm install

# Start all services
pnpm dev

# Run all checks
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

## CI/CD

### `ci.yml` — runs on every PR

| Step | Command |
|------|---------|
| Lint | `pnpm turbo run lint` |
| Typecheck | `pnpm turbo run typecheck` |
| Test | `pnpm turbo run test` |
| Build | `pnpm turbo run build` |

Python ai-service is checked in a parallel job (ruff + pytest).

### `deploy-staging.yml` — runs on merge to `main`

1. CI gate (same checks as above)
2. Build Docker images → push to AWS ECR
3. Run `prisma migrate deploy` as a one-off ECS task
4. Update ECS task definitions and deploy all three services
5. Post deployment summary as a PR comment

---

## GitHub Actions secrets

Configure these in **Settings → Secrets and variables → Actions** on the GitHub repo.

### Required for deploy-staging

| Secret | Description | Where to get it |
|--------|-------------|-----------------|
| `AWS_DEPLOY_ROLE_ARN` | IAM role assumed via OIDC for ECR push + ECS deploy | `terraform output github_actions_deploy_role_arn` in `infra/environments/staging` |
| `AWS_ACCOUNT_ID` | 12-digit AWS account ID | AWS Console or `aws sts get-caller-identity` |
| `STAGING_PRIVATE_SUBNET_IDS` | Comma-separated private subnet IDs for the migration ECS task (e.g. `subnet-abc,subnet-def`) | `terraform output` → VPC private subnets |
| `STAGING_ECS_SECURITY_GROUP_ID` | Security group ID for ECS tasks | `terraform output` → ECS tasks SG |

### AWS OIDC provider (one-time setup)

Before the first deploy, ensure the GitHub Actions OIDC provider exists in your AWS account:

```bash
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1
```

The Terraform IAM module creates the `flowiq-staging-github-actions-deploy` role that trusts this provider.

### Branch protection

Enable **require status checks to pass** on `main` and add these required checks:
- `Node.js (lint / typecheck / test / build)`
- `Python (lint / test)`

---

## Infrastructure

See [`infra/README.md`](./infra/README.md) for Terraform setup and staging deployment instructions.
