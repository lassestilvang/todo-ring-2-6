# Release Checklist for TaskPlanner

## Pre-Release (Before Tag)
- [ ] All tests passing (unit, integration, E2E)
- [ ] Code coverage at 90%+ for all modules
- [ ] Security audit clean (`npm audit`)
- [ ] No TypeScript errors (`npm run typecheck`)
- [ ] Linting clean (`npm run lint`)
- [ ] Documentation updated (API docs, user docs)
- [ ] Migration scripts tested
- [ ] Breaking changes documented in CHANGELOG.md
- [ ] Version bumped in package.json
- [ ] Canary deployment successful in staging

## Release Process
- [ ] Create and push git tag
- [ ] Verify Docker image builds
- [ ] Deploy to production
- [ ] Monitor error rates and performance
- [ ] Update documentation links
- [ ] Announce release to users
- [ ] Create GitHub release with changelog

## Post-Release
- [ ] Monitor for 24 hours
- [ ] Update version bump for next release
- [ ] Clean up staging environment
- [ ] Archive old migration scripts (30+ days old)
- [ ] Review and update security dependencies

## Rollback Procedure (If Needed)
1. Revert to previous Kubernetes deployment
2. Restore database from backup if schema changed
3. Notify team and document rollback reason
4. Address issues and plan re-release