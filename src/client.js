// import axios from "axios";

const axios = require("axios");
const { ServerWritableStream } = require("grpc");

const camada = "aguas_e_esgotos"

const dados = []

async function listarSum(iAno) {
    const busca = [];
   
    const { data } = await axios.get("http://localhost:8052/sgeol-time-series/"+camada+"/date/"+iAno)
    busca.push(data);
    console.timeLog("Requisição 1");

    return busca;
}

async function listarMuitaCoisa(iAno, fAno) {
    const busca = [];
    while(iAno <= fAno){
        const { data } = await axios.get("http://localhost:8052/sgeol-time-series/"+camada+"/entity/urn:ngsi-ld:aguas_e_esgotos:0a636771-a0f4-423e-b6a7-103a75db4022?date="+iAno)
        busca.push(data);
        console.timeLog("Requisição 2");
        iAno++;
    }
    return busca;
}

async function findByDate() {
    const chuncks = []
    let chunck = await axios.get("http://localhost:8052/sgeol-time-series"+camada+"/interval?inicialDate=2001&finalDate=2003")
    chunck.on("data", (stream) => {
        chuncks.push(stream);
    })
    console.log(chuncks);
}

async function listarTudo() {
    // console.time("Requisição 1");
    // const dados = await listarSum(2001);
    // console.log(dados);
    console.time("Requisição 2");
    const dados2 = await listarMuitaCoisa(2001, 2019);
    console.log(dados2.length);
}
// listarTudo();

findByDate()