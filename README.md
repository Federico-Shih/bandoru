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
TODO

## Uso de funciones y meta-argumentos
TODO


