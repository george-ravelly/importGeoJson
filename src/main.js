let fileName = 2019;
let jsonData = require("./Arquivos/"+fileName+".json");
const jsonIds = require("./Arquivos/entity_id.json");
const camada = "aguas_e_esgotos";

const { v4 } = require("uuid");
const axios = require("axios");


// const appToken = "4809d56e-0f68-445f-9d59-23f29b61489f";
// const userToken = "616bb6cc-8bf4-4d51-8ee4-bac75db027e4";

const appToken = "30216118-d4d6-45b9-bf4c-b52207619e50";
const userToken = "23808237-ae7e-4d0b-86f9-2a3f04b0e0af";
const appManToken = "3463296e-bbdb-4954-800b-5d3cbc789e03";
const appId = "5f5431b3-7a62-4a26-aba2-24f3bfdc740f";

/**
 * 
 * @param {*} obj com as entidades a serem formatadas 
 * @returns 
 */
function formatarObjeto(obj) {
    let type = "aguas_e_esgotos";
    let id = "urn:ngsi-ld:"+type+":";
    const entidades = obj.features;
    const novaEntidade = [];
    for (let i = 0; i < entidades.length; i++) {
        const properties = entidades[i].properties;
        const uuid = v4();
        let o = createObject(id+uuid, type);
        const key = Object.keys(properties);
        key.forEach(element => {
            o[element] = {
                "type": 'Property',
                "value": properties[element] !== null ? properties[element] : 0
            }
            if (element === "Municipio") {
                o["nome"] = {
                    "type": "Property",
                    "value": properties[element] !== null ? properties[element] : 0
                }
                o["name"] = {
                    "type": "Property",
                    "value": properties[element] !== null ? properties[element] : 0
                }
            }
        });
        o["location"] = {
            "type": "GeoProperty",
            "value": {
                "type": "Point",
                "coordinates" : [
                    [latitude, logitude]
                ]
            }
            
        };
        novaEntidade.push(o);
    }
    // console.log(novaEntidade);
    return novaEntidade;
}

async function formatarObjetoAtulizacao(obj) {
    const final = []
    try {
        const novaEntidade = obj.features;
        const savedEntities = await getLayerEntities();
        novaEntidade.forEach(element => {
            const ent = buscarId(savedEntities, element.properties);
            const properties = element.properties;
            const key = Object.keys(properties);
            const date = obj.name;
            const dados = []
            key.forEach(k => {
                dados.push(
                    {
                        entityId: ent.id, 
                        propertyName: k, 
                        date: date+"", 
                        value: properties[k] !== null ? properties[k] : 0
                    }
                );
            });
            final.push(dados)
        });
        return final;
    } catch (error) {
        console.log(error);
    }
}

function buscarId(oldArray = [], element) {
    return oldArray.find(el => {
        return el["CD_MUN"].value+"" === element.CD_MUN
    })
}

/**
 * 
 * @param {*} id da entidade
 * @param {*} type nome da camada
 * @returns 
 */
function createObject(id, type) {
    return {
        "@context": ["https://forge.etsi.org/gitlab/NGSI-LD/NGSI-LD/raw/master/coreContext/ngsi-ld-core-context.jsonld"],
        "id": id,
        "type": type,
    };
}

async function getUserToken(password, username, applicationToken) {
    const body = {
        password,
        username,
        "application-token": applicationToken
    };

    const headers = {
        Authorization: "N2QyMGJlZWQtZDFhOC00MmNmLTk1M2ItMjUyZjFhZjc1NmM0OjhmNzM5Y2M2LTE3MDgtNDIxMi1iODUzLTEyNjc4MjVmNWNhMA==",
        "Content-Type": "application/x-www-form-urlencoded"
    };

    const userToken = await axios.post(
        "http://localhost:8080/sgeol-dm/v2/security/auth/login/user", 
        body, 
        {
            headers: headers
        }
    );

    return userToken.data;
}

async function getAppToken(password, username) {
    const body = {
        password: "1234",
        username : "app_test@test.com"
    };

    const headers = { "Content-Type": "application/x-www-form-urlencoded" }
    let appToken = null;
    try {
        appToken = await axios.post(
            "http://localhost:8080/sgeol-dm/security/auth/login/app", 
            body, 
            {
                headers: headers
            }
        );
    } catch (error) {
        console.log(error);
    }

    return appToken;
}


/**
 * 
 * @returns um array com todas as entidades da camada
 */
async function getLayerEntities() {
    let entities = [];
    let flag = true;
    let limit = 400;
    let offset = 0;
    const headers = {
        'application-token': appToken,
        'user-token': userToken
    };
    while(flag) {
        try {
            const arr = await axios.get(
                "http://localhost:8080/sgeol-dm/v2/aguas_e_esgotos?limit="+limit+"&offset="+offset,
                {
                    headers: headers
                }
            );
            if(arr.data[0] === undefined) {
                flag = false
            } else {
                offset += limit;
                entities = entities.concat(arr.data);
                console.log('\033[2J');
                console.log("Carregando ", offset);
            }
        } catch (error) {
            console.log(error);
        }
    }
    console.log("Entidades ", entities.length);
    return entities;
}

async function getAuth() {
    try {
        const appToken = await getAppToken("1234", "app_test@test.com");
        const userToken = await getUserToken("1234", "gerente_app_test@test.com", "0152bded-403d-4981-a19e-c22892c42227")
        console.log("auth", appToken);
    } catch (error) {
        console.log(error);
    }
}

let count = 0;

function cadastrarEntidades() {
    const entidades = formatarObjeto(jsonData);
    console.log(entidades);
    const headers = {
        'Content-Type': 'application/json',
        'application-token': appToken,
        'user-token': userToken,
        'application-id': appId,
        'app-management-token': appManToken
    };
    entidades.forEach(el => {
        save(el, headers);
    })
    console.log("finalizou");
    count = 0;
}

function save(body, headers) {
    axios.post("http://localhost:8080/sgeol-dm/v2/"+camada, body, {
        headers: headers
    }).then(() => {
        console.log('\033[2J');
        console.log("Salvando... ", ++count, fileName);
    }).catch((error) => {
        console.log(error);
    })
}

async function atualizarEntidades(ano) {
    try {
        const data = await require("./Arquivos/"+ano+".json")
        const entidades = await formatarObjetoAtulizacao(data);
        const headers = {
            'Content-Type': 'application/json',
            'application-token': appToken,
            'user-token': userToken
        };
        entidades.forEach(el => {
            atualizar(el);
            console.log('atualizando...');
        })
        count = 0;
    } catch (error) {
        console.log(error);
    }
    console.log('\033[2J');
    console.log("finalizou");
}

function atualizar(body) {
    axios.post(
        "http://localhost:8052/sgeol-time-series/saveAll/"+camada,
        body, 
        {
            headers: {
                'Content-Type': 'application/json'
            }
    }).then(() => {
        console.log('\033[2J');
        console.log("Atualizando... ", ++count, fileName);
    }).catch((error) => {
        console.log(error);
    })
}

// cadastrarEntidades()
// getAuth()
// getLayerEntities()

atualizarEntidades(fileName);

// formatarObjetoAtulizacao(jsonData)