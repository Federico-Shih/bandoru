# Setup Consola AWS
Partimos desde Lab recién reiniciado
## S3
1. Create Bucket
    1. General Purpose
    1. Bucket name = 'bandoru-bucket-legajoTuyo'
    1. Object Ownership = ACLs enabled -> bucket owner preferred
    1. Block all public access = desactivado
    1. Bucket versioning = True
    1. Encryption -> dejar default
    1. Object Lock = disabled
## VPC
1. Borramos VPC default (opcional)
1. Your VPCs > Create VPC
    1. VPC only
    1. Name tag = 'Bandoru'
    1. CIDR Block = '10.0.0.0/16'
    1. IPv6 CIDR Block = No
1. Your VPCs > Bandoru > Actions > Edit VPC settings
    1. Enabled DNS Hostnames = True
    1. Save
1. Route Tables > Create Route Table
    1. name = 'lambda-route-table'
    1. vpc = bandoru
1. Route Tables > Create Route Table
    1. name = 'rds-route-table'
    1. vpc = bandoru
1. Endpoints > Create Endpoint
   1. Name Tag =  's3-endpoint'
   2. Service category = AWS service
   3. Services = com.amazonaws.us-east-1.s3 -> Gateway
   4. VPC = bandoru
   5. Route tables = 'lambda-route-table'
   6. Policy = Full access
1. Subnets > Create Subnet
    1. VPC = bandoru
    1. name = 'lambda-1a'
    1. AZ = 'us-east-1a'
    1. CIDR 10.0.10.0/24
    1. Add new subnet...
    1. VPC = bandoru
    1. name = 'lambda-1b'
    1. AZ = 'us-east-1b'
    1. CIDR 10.0.20.0/24
    1. Add new subnet...
    1. VPC = bandoru
    1. name = 'rds-1a'
    1. AZ = 'us-east-1a'
    1. CIDR 10.0.30.0/24
1. Route Tables > lambda-route-table > Subnet Assoc > Edit Subnet Assoc
    1. Selecciono lambda-1a y lambda-1b
    1. Save
1. Route Tables > rds-route-table > Subnet Assoc > Edit Subnet Assoc
    1. Selecciono rds-1a
    1. Save

## RDS
1. Databases > Create Database
    1. Standard Create
    1. Engine = Postgresql (no aurora)
    1. Templates = Free Tier
    1. DB instance id = 'bandoru-db'
    1. Master username = 'postgres'
    1. Master passwd = 'lechugapasion'
    1. Compute resource = Don't connect...
    1. VPC = bandoru
    1. DB subnet group = create new
    1. Public access = NO
    1. VPC sg = Create New
    1. VPC sec group name = default
    1. AZ = us-east-1a
    1. Create RDS Proxy = False -> Consume demasiado
    1. Monitoring -> Turn on Perf insights = False
    1. Todo lo demás, dejar el default
## Lambda
1. Functions > Create function
    1. Author from scratch
    1. name = 'bandoru-lambda'
    1. runtime = python3.12
    1. arch = x86
    1. Change default exec role > Execution role = Use an existing role
    1. Existing role = LabRole
    1. Advanced settings > Enable VPC = True
    1. VPC = Bandoru
    1. subnets = lambda-1a y lambda-1b
    1. Security Group = default
   2. Poner variables de entorno
## Attach Lambda to RDS
1. Databases > bandoru-db > Connectivity & security > Actions > Set up Lambda Connection
   2. Lambda function = bandoru-lambda
   3. Connect using RDS Proxy = False 
   4. Setup
## API Gateway
1. Create API > HTTP API > Build
    1. Add Integrations > Lambda
        1. Lambda function = bandoru-lambda
    1. api name = bandoru-api
    1. Next
    1. Routes: Method = ANY | Resource path = /{proxy | integration targe = bandoru-lambda
    1. Next
    1. Next
    1. Create


# Setup Local
## Instalando AWS CLI
```shell
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```
Se instala en `/usr/local/bin/aws`. Verificar que funciona con `aws --version`.
Abrir el lab y en donde está el botón para comenzar y frenar el lab hay uno que dice 'AWS Details'. Ahí poner AWS CLI > Show
Crear un archivo en `~/.aws/` llamado `credentials` con el contenido que aparece ahí.
Luego, correr `aws configure`. Dar dos enters, y en `Default region name` ponerle `us-east-1`.
## Deploy
Para deployear correr el siguiente script
```shell
./deploy.sh
```
Las environmant variables se pueden setear en Configuration > Environment Variables
