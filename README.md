# Trabajo Práctico Cloud Computing - Entrega 3
## Grupo 9 - Integrantes
- Federico Shih
- Franco David Rupnik
- Agustín Morantes
- Matías Manzur
## Arquitectura
TODO: insert diagrama

## How to deploy
### Prerequisitos
- terraform v1.9+
- aws-cli
- jq (commandline JSON processor)
- docker

### Pasos
1. Configurar credenciales de aws para que terraform se conecta a nuestra cuenta de aws.
2. Ejecutar el script de deploy `./full_deploy.sh`
3. Esperar a que se ejecute el terraform y el deploy del frontend y el backend.

Las variables de terraform están en `/frontend/terraform.tfvars`. Ahí se puede establecer cuál es el profile de aws a usar. Por defecto usa el 'default'.

**Nota:** Una vez sola nos pasó que se vencieron las credenciales de aws a la mitad del terraform apply y tiro un error que la account no tiene los permisos para hacer X modificación. Si esto sucede, apagar y prender el lab, volver a setear las credenciales y ejecutar de nuevo el script.

## Módulos utilizados
Los modulos externos que se usan en el código son los siguientes:
- ["terraform-aws-modules/dynamodb-table/aws"](https://registry.terraform.io/modules/terraform-aws-modules/dynamodb-table/aws/latest): Modulo para crear tablas de DynamoDB e indices
- ["terraform-aws-modules/vpc/aws"](https://registry.terraform.io/modules/terraform-aws-modules/vpc/aws/latest): Modulo para crear VPCs y todo lo necesario dentor de las mismas

Los modulos internos que se usan en el código son los siguientes:
- [lambda](lambda): Modulo para crear las lambdas para cada funcion que se implementa en el backend incluido los API Gateway y los permisos necesarios

## Uso de funciones y meta-argumentos
Las funciones usadas en el código son las siguientes:
- [abspath](https://developer.hashicorp.com/terraform/language/functions/abspath): Devuelve la ruta absoluta de un archivo, lo usamos para obtener el path del root y con ello poder acceder al archivo de codigo placeholder de Lambdas
- [zipmap](https://developer.hashicorp.com/terraform/language/functions/zipmap): Construye un mapa en base a dos listas ([keys],[values]), lo usamos para construir el mapa de variables de entorno de las Lambdas
- [length](https://developer.hashicorp.com/terraform/language/functions/length): Devuelve la longitud de una lista, lo usamos para obtener la cantidad de elementos en el modulo de lambda y saber cuantas tenemos que crear
- [join](https://developer.hashicorp.com/terraform/language/functions/join): Permite concatenar strings, lo usamos para armar el source_arn que se usa en el permiso de la lambda

Los meta-argumentos usados en el código son los siguientes:
- [count](https://developer.hashicorp.com/terraform/language/meta-arguments/count): Permite crear multiples recursos de un mismo tipo, lo usamos para crear multiples lambdas que solo cambian en el nombre
- [for_each](https://developer.hashicorp.com/terraform/language/meta-arguments/for_each): Permite crear multiples recursos de un mismo tipo, lo usamos para crear varios de los recursos necesarios
- [depends_on](https://developer.hashicorp.com/terraform/language/meta-arguments/depends_on): Permite establecer dependencias entre recursos, lo usamos para explicitar varias de las dependencias que tienen los recursos que no pueden ser inferidas como en los buckets

