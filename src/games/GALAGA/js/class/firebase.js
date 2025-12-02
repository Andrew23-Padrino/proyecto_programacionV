import {firebaseConfig, initializeApp } from "../firebase_config.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, getDoc, updateDoc, query, where, onSnapshot, or, limit } from "https://www.gstatic.com/firebasejs/10.3.1/firebase-firestore.js";

export class Firebase
{
    constructor()
    {
        this.app = initializeApp(firebaseConfig);
        this.db = getFirestore();
    }

   
   
    async buscarUsuarioPorCredenciales(usuario)
    {
        const existe_SM = 
        {
            correo: false,
            nombreUsuario: false
        }
        const consultaCorreo_SM = query(
            collection(this.db, "usuarios"),
            where('correo', '==', usuario.correo))
            
        const querySnapshotCorreo_SM = await getDocs(consultaCorreo_SM);

        querySnapshotCorreo_SM.forEach((doc) => {
            console.log(doc.data())
            existe_SM.correo = true;
        });

        const consultaNombreUsuario_SM = query(
            collection(this.db, "usuarios"),
            where("nombreUsuario", '==', usuario.nombreUsuario))

        const querySnapshotNombreUsuario_SM = await getDocs(consultaNombreUsuario_SM);
        querySnapshotNombreUsuario_SM.forEach((doc) => {
            console.log(doc.data())
            existe_SM.nombreUsuario = true;
        });  

        return existe_SM;
    }

  

    registrarUsuario(usuario)
    {
        addDoc(collection(this.db, "usuarios"), usuario);
    }




    async encontrarUsuario(nombreUsuario, clave)
    {
        let usuario_SM = false;
        const consulta_SM = query(
        collection(this.db, "usuarios"),
        where('nombreUsuario', '==',nombreUsuario),
        where('clave', '==', clave), 
        limit(1))

        
        const querySnapshot_SM = await getDocs(consulta_SM);

        querySnapshot_SM.forEach((doc)=>{
            if(doc.exists)
            {
                usuario_SM = 
                {
                    id: doc.id,
                    data: doc.data()
                }
            }
        });

        return usuario_SM;

    }

    async actualizarEstadisticas(id, victorias, derrotas)
    {
        console.log("derrotas a colocar", derrotas);
        let estadisticasActualizadas_SM = {victorias: victorias, derrotas: derrotas};
        updateDoc(doc(this.db, 'usuarios', id), estadisticasActualizadas_SM);
        console.log("Estadísticas actualizadas con éxito");
    }
}