# Blue/Green Deployments

- Maintain two stacks: blue (live), green (idle).
- Deploy to green; run smoke tests.
- Switch traffic via load balancer weight.
- Rollback by reverting weights.

