var contractSource = `
contract DemocraticPartAsset=

  record part = {
         creatorAddress : address,
         partName       : string,
         assetName      : string
             
   }
   
   
  record state ={
          parts : map(int, part),
          totalPart :int
    }
  
  entrypoint init() = {
        parts = {},
        totalPart = 0 
        
        }
  
  stateful entrypoint registerPart(name : string, asset : string) =
        let part ={
            creatorAddress = Call.caller,
            partName       = name,
            assetName      = asset
            }
        
        let index = getTotalPart() +1
        
        put( state { parts[index] = part, totalPart = index})
        
        
        
        
  entrypoint getPart(index :int ) :part =
    state.parts[index]
    
    
  entrypoint getTotalPart() : int =
        state.totalPart
`;
var contractAddress= "ct_KcvgWcMfaMwNvg6ywqMpKAgVVArmjTxzf2KCW7gvCXGz392LB";

var client =null;

var partArray = [];
var partTotal =0;

async function renderPart() {
    var template=$('#template').html();
    Mustache.parse(template);
    var render = Mustache.render(template, {partArray});
    $('#child-list').html(render);
    partTotal = await callStatic('getTotalPart', [])
    $('#total').html(partTotal);
}

async function callStatic(func,args){
    const contract = await client.getContractInstance(contractSource, {contractAddress});
   
    const calledGet =await contract.call(func,args,{callStatic : true}).catch(e =>console.error(e))
    //console.log('calledGet',calledGet);

    const decodedGet = await calledGet.decode().catch(e =>console.error(e));
    //console.log(decodedGet)
    return decodedGet;
}

async function contractCall(func, args,value) {
    const contract = await client.getContractInstance(contractSource, {contractAddress});
   
    const calledGet =await contract.call(func,args,{amount : value}).catch(e =>console.error(e))

    return calledGet;
  }



window.addEventListener('load',async () =>{
    $('#loader').show();
    client = await Ae.Aepp();

    partTotal = await callStatic('getTotalPart', []);

    for (let i = 1; i <= partTotal; i++) {
       const part = await callStatic('getPart',[i]);

        partArray.push({
            owner           : part.creatorAddress,
            name            : part.partName,
            asset           : part.assetName
        })

        
    }

console.log(partArray);

    renderPart();

$('#loader').hide();
$('#main').show();
});



$(document).on('click','#saveBtn', async function(){
    $('#loader').show();
    const name = $('#name').val();
    const asset = $('#asset').val();

    // partArray.push({
    //     partName  : name,
    //     assetName : asset
    // })

await contractCall('registerPart',[name, asset], 0);
  renderPart();

$('#loader').hide();
});

