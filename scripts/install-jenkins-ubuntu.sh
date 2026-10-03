#!/bin/bash
# Installs Jenkins, Java 21, Git, Docker and Node.js 22 on Ubuntu 22.04 / 24.04.
# Usage: bash scripts/install-jenkins-ubuntu.sh
set -euo pipefail

# Jenkins needs at least ~1 GB of free disk space or it takes its node offline.
# The default 8 GB EC2 volume is too small, so require a larger disk up front.
TOTAL_GB=$(df -BG --output=size / | tail -1 | tr -dc '0-9')
if [ "$TOTAL_GB" -lt 15 ]; then
  echo "ERROR: the root disk is only ${TOTAL_GB} GB. Use at least 20 GB (see docs/jenkins-setup.md)."
  exit 1
fi

# Remove a stale Jenkins repo entry from an earlier failed run, so apt-get update works
sudo rm -f /etc/apt/sources.list.d/jenkins.list

echo "==> Installing base packages (Java 21 is required by current Jenkins)"
sudo apt-get update -y
sudo apt-get install -y fontconfig openjdk-21-jre git docker.io curl gnupg ca-certificates

echo "==> Installing Node.js 22"
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

echo "==> Adding the Jenkins apt repository (2026 signing key)"
sudo mkdir -p /usr/share/keyrings
curl -fsSL https://pkg.jenkins.io/debian-stable/jenkins.io-2026.key \
  | sudo tee /usr/share/keyrings/jenkins-keyring.asc > /dev/null
echo "deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] https://pkg.jenkins.io/debian-stable binary/" \
  | sudo tee /etc/apt/sources.list.d/jenkins.list > /dev/null

echo "==> Installing Jenkins"
sudo apt-get update -y
sudo apt-get install -y jenkins

echo "==> Allowing the jenkins user to run Docker"
sudo usermod -aG docker jenkins

sudo systemctl enable --now docker
sudo systemctl enable --now jenkins
sudo systemctl restart jenkins

echo "==> Waiting for Jenkins to start (up to 3 minutes)"
for i in $(seq 1 36); do
  if sudo test -f /var/lib/jenkins/secrets/initialAdminPassword; then
    break
  fi
  sleep 5
done

echo
echo "Jenkins is running on port 8080: http://<EC2-PUBLIC-IP>:8080"
echo "Initial admin password:"
sudo cat /var/lib/jenkins/secrets/initialAdminPassword
