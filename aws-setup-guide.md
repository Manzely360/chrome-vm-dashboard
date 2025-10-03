# AWS Setup Guide for Chrome VM Dashboard

## Prerequisites

1. **AWS Account**: You need an active AWS account
2. **AWS CLI**: Already installed ✅
3. **Terraform**: Already installed ✅

## Step 1: Create AWS IAM User

1. Go to [AWS IAM Console](https://console.aws.amazon.com/iam/)
2. Click "Users" → "Create user"
3. Username: `chrome-vm-dashboard`
4. Select "Programmatic access"
5. Attach policies:
   - `AmazonEC2FullAccess`
   - `AmazonVPCFullAccess`
   - `AmazonS3FullAccess`
   - `IAMFullAccess`
   - `CloudFormationFullAccess`

## Step 2: Generate Access Keys

1. After creating the user, go to "Security credentials" tab
2. Click "Create access key"
3. Choose "Application running outside AWS"
4. Download the credentials or copy them

## Step 3: Configure AWS CLI

Run the following command and enter your credentials:

```bash
aws configure
```

Enter:
- AWS Access Key ID: `your-access-key-here`
- AWS Secret Access Key: `your-secret-key-here`
- Default region name: `us-west-2` (or your preferred region)
- Default output format: `json`

## Step 4: Verify Configuration

```bash
aws sts get-caller-identity
```

Should return your account details.

## Step 5: Create SSH Key Pair

```bash
# Create SSH key pair
ssh-keygen -t rsa -b 4096 -f ~/.ssh/chrome-vm-key

# Add to AWS
aws ec2 import-key-pair \
  --key-name "chrome-vm-key" \
  --public-key-material fileb://~/.ssh/chrome-vm-key.pub
```

## Step 6: Configure Terraform

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` with your values:

```hcl
aws_region = "us-west-2"
instance_type = "t3.medium"
volume_size = 50
min_instances = 1
max_instances = 10
desired_instances = 3

# Get your SSH public key
ssh_public_key = "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQC... your-public-key-here"

# Your domain (or use localhost for testing)
dashboard_url = "https://your-domain.com"
domain_name = "your-domain.com"

project_name = "chrome-vm-dashboard"
environment = "production"
```

## Step 7: Deploy Infrastructure

```bash
# Initialize Terraform
terraform init

# Plan deployment
terraform plan

# Apply deployment
terraform apply
```

## Step 8: Get Your SSH Public Key

```bash
cat ~/.ssh/chrome-vm-key.pub
```

Copy this output and use it in your `terraform.tfvars` file.

## Cost Estimation

- **t3.medium**: ~$30/month per instance
- **t3.large**: ~$60/month per instance
- **Storage**: ~$5/month per 50GB
- **Data transfer**: Variable

For testing, start with 1-2 instances to minimize costs.

## Security Notes

- The IAM user has broad permissions for simplicity
- In production, create more restrictive policies
- Consider using AWS Organizations for better management
- Enable CloudTrail for audit logging
