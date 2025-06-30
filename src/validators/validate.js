function validate (schema, target = 'body'){
    return(req,res,next)=>{
        const data = req[target];

        //paso1, verficar que haya datos
        if(!data || Object.keys(data).lenght === 0){
            return res.status(400).json({message: 'No data found'})
        }

        //paso2, validar contra el schema de opciones
        const{error,value} = schema.validate(data,{
            abortEarly: false, //para que no se detenga en el primer error
            stripUnknown: true, //para que elimine los campos que no estan en el schema
        })

        //paso3, si hay errores de validacion, devolver 400 con los mensajes
        if (error){
            return res.status(400).json({
                message: `error de validacion en ${target}`,
                errores: error.details.map(err => err.message)
            })
        }

        //paso4, reemplazar el objeto original con los datos limpios
        req[target] = value;

        //paso5, continuar con el siguiente middleware
        next();
    }
}

export default validate