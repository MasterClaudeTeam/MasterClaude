---
name: sec-iac-cloud
description: >-
  Review infrastructure-as-code and cloud config for misconfiguration — Dockerfiles (root user, exposed
  ports, baked secrets), Kubernetes (privileged, hostPath, no limits), Terraform/cloud (public buckets,
  over-permissive IAM, open security groups, unencrypted storage), and secrets committed in IaC. Use when
  reviewing Dockerfile, compose, k8s manifests, Terraform/CloudFormation, or CI config.
allowed-tools: Read, Grep, Glob, Bash
---

# Security: IaC & cloud configuration review

Misconfiguration (OWASP A05) is the most common cloud-breach cause — the code is fine, the config is open.

## What to check
- **Docker.** Runs as **root** (no `USER`); secrets baked into layers / `ENV`; `latest` base tags;
  unnecessary exposed ports; `--privileged`. Prefer a non-root user, multi-stage builds, pinned digests, a
  minimal base.
- **Kubernetes.** `privileged: true`, `hostPath` / `hostNetwork` / `hostPID`, running as root, no
  `resources.limits` (DoS), no `readOnlyRootFilesystem`, secrets in env instead of Secrets, missing
  NetworkPolicies, `automountServiceAccountToken` where unneeded.
- **Terraform / CloudFormation / cloud.** Public S3/GCS buckets or blob containers; security groups open to
  `0.0.0.0/0` on sensitive ports (22/3389/db); IAM with `*:*` or wildcard resources; unencrypted
  storage/volumes/RDS; public DB instances; logging/audit disabled.
- **Secrets in IaC.** `Grep` for keys/passwords/tokens hardcoded in manifests, tfvars, compose, CI yaml.
  (Cross-check `sec-secrets-crypto`.)
- **CI/CD.** Over-privileged pipeline tokens; untrusted PR workflows with access to secrets; unpinned
  third-party actions.

## Output
`path:line` · CWE (e.g. CWE-732 perms, CWE-16 config) · severity · evidence · fix (the hardened setting).
Coverage note. Suggest a scanner (`trivy`, `checkov`, `tfsec`, `kube-score`) for continuous coverage.
