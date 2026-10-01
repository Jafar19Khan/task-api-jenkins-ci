# Jenkins Setup Guide

This guide sets up Jenkins on an AWS EC2 instance and connects it to this GitHub repository.

## 1. Launch an EC2 instance

- AMI: Ubuntu 22.04 or 24.04
- Instance type: `t3.micro` (or `t2.micro`, free-tier eligible depending on your account)
- Storage: 20 GB
- Security group inbound rules:
  - Port 22 (SSH): your IP only
  - Port 8080 (Jenkins): your IP for the UI. GitHub webhooks also need to reach this port
    (see step 5).

A micro instance has about 1 GB of RAM, so add swap before installing Jenkins:

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

## 2. Install Jenkins, Docker and Node.js

```bash
ssh -i your-key.pem ubuntu@<EC2-PUBLIC-IP>
git clone https://github.com/Jafar19Khan/task-api-jenkins-ci.git
cd task-api-jenkins-ci
bash scripts/install-jenkins-ubuntu.sh
```

The script prints the initial admin password at the end.

## 3. Finish the Jenkins setup

1. Open `http://<EC2-PUBLIC-IP>:8080`
2. Paste the initial admin password
3. Choose **Install suggested plugins**
4. Create your admin user

## 4. Create the pipeline job

1. **New Item** -> enter a name -> select **Pipeline** -> OK
2. Under **Build Triggers**, tick **GitHub hook trigger for GITScm polling**
3. Under **Pipeline**:
   - Definition: **Pipeline script from SCM**
   - SCM: **Git**
   - Repository URL: your public GitHub repository URL (no credentials needed for public repos)
   - Branch specifier: `*/main`
   - Script Path: `Jenkinsfile`
4. Save, then click **Build Now** for the first run

## 5. Add the GitHub webhook

In your GitHub repository: **Settings -> Webhooks -> Add webhook**

- Payload URL: `http://<EC2-PUBLIC-IP>:8080/github-webhook/`
- Content type: `application/json`
- Events: **Just the push event**

GitHub sends webhooks from published IP ranges, so port 8080 must accept traffic from them.
For a short-lived learning setup you can open 8080 temporarily. If you would rather keep it
closed, use **Poll SCM** in the job (for example `H/5 * * * *`) instead of the webhook.

## 6. Try it

- **Pass**: change something small, commit, push. The build should turn green.
- **Fail**: in `test/store.test.js`, change an expected value so a test fails, then push.
  The Test stage fails and the Docker stages never run. Revert the change to go green again.

## Troubleshooting

| Problem | Fix |
|---|---|
| `docker: permission denied` in the build | `sudo usermod -aG docker jenkins && sudo systemctl restart jenkins` |
| `node: command not found` | Re-run the install script, or install Node.js 22 on the server |
| Webhook shows a red cross in GitHub | Check the security group for port 8080 and the trailing `/github-webhook/` in the URL |
| Build does not start after a push | Confirm the "GitHub hook trigger" box is ticked in the job |
| Jenkins is slow or freezes | Add swap (step 1) or use a larger instance |
| Port 3001 already in use during smoke test | Run `docker ps` and remove any leftover `task-api-smoke-*` container |

## Clean up

Stop or terminate the EC2 instance when you finish to avoid charges.
