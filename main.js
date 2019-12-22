var contractSource = `
payable contract DonateChild=
      
  record child = {
               ownerAddress: address,
               name        : string,
               age         : int,
               gender      : string,
               location    : string,
               url         : string,
               amount      : int,
               id          : int,
               isOpened    : bool
               
               }
               
  record state = {
  
                 childs    : map(int,child),
                 totalChild: int
                
  
                 }
          
  entrypoint init() = {
                  
                   childs      = {},
                   totalChild = 0
  
                      }
                      
                      
  stateful entrypoint registerChild(name' : string, age' : int, gender' : string, location' : string, url' : string) =
                             
                            let child =   {
                                            ownerAddress = Call.caller,
                                            name         = name',
                                            age          = age',
                                            gender       = gender',
                                            location     = location',
                                            url          = url',
                                            amount       = 0,
                                            id           = getTotalChild() +1,
                                            isOpened     = true
                                            }
                                            
                            
                            let index  = getTotalChild() + 1
                              
                            put(state {childs[index]=child, totalChild = index})
                                            
                                            
                                            
                      
  entrypoint getChild(index : int): child =
                 switch(Map.lookup(index, state.childs))
                   None => abort("There was no child with this index registered")
                   Some(x) => x
       
       
       
       
  entrypoint getTotalChild() : int =
        state.totalChild   
        
      
        
  payable stateful entrypoint donate(index : int) =
          let child = getChild(index)
          Chain.spend(child.ownerAddress,Call.value)
          let updateAmount =child.amount+Call.value
          let updateChilds =state.childs{[index].amount = updateAmount }
          put(state {childs = updateChilds})
          
          
          
  stateful entrypoint closeDonation(index : int) =
         let child          =  getChild(index)
         let updateIsOpened =  false
         let updateChilds    =  state.childs{[index].isOpened = updateIsOpened }
         put(state {childs  =  updateChilds })
         
    
  stateful entrypoint openDonation(index : int) =
         let child          =  getChild(index)
         let updateIsOpened =  true
         let updateChilds    =  state.childs{[index].isOpened = updateIsOpened }
         put(state {childs  =  updateChilds })
         
         
         
         
`;
var contractAddress= "ct_UmMZXVMjcrvjisFCUcLVmG447oh24MRbRkSaqqWW9afM49HWQ";

var client =null;

var childsArray = [];
var childTotal =0;

async function renderChild() {
    var template=$('#template').html();
    Mustache.parse(template);
    var render = Mustache.render(template, {childsArray});
    $('#child-list').html(render);
    childTotal = await callStatic('getTotalChild', [])
    $('#total').html(childTotal);
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

    childTotal = await callStatic('getTotalChild', []);

    for (let i = 1; i <= childTotal; i++) {
       const child = await callStatic('getChild',[i]);

        childsArray.push({
            owner           : child.ownerAddress,
            name            : child.name,
            age             : child.age,
            gender          : child.gender,
            location        : child.location,
            url             : child.url,
            amount          : child.amount,
            id              : child.id,
            isOpened        : child.isOpened

        })

        
    }

console.log(childsArray);

    renderChild()

$('#loader').hide();
$('#main').show();
});



$(document).on('click','#saveBtn', async function(){
    $('#loader').show();
    const name = $('#name').val();
    const age = $('#age').val();
    const gender = $('#gender').val();
    const location = $('#location').val();
    const url = $('#url').val();
   

         childsArray.push({
            name            : name,
            age             : age,
            gender          : gender,
            location        : location,
            url             : url,
           
 })

await contractCall('registerChild',[name, age,gender,location,url], 0);

  //location.reload((true));
  renderChild();
$('#loader').hide();
});


$('#child-list').on('click','.donateBtn', async function(e){
  jQuery('#loader').show();
  
  const childID = e.target.id;
  const amount = $('input[id='+childID+']').val();
   console.log(childID +"-"+amount)

await contractCall('donate',[childID], amount);


location.reload((true));
renderChild();
$('#loader').hide();
});


$('#child-list').on('click','.openBtn', async function(e){
  jQuery('#loader').show();
  
  const childID = e.target.id;
  

await contractCall('openDonation',[childID], 0);


location.reload((true));
renderChild();
$('#loader').hide();
});

$('#child-list').on('click','.closeBtn', async function(e){
  jQuery('#loader').show();
  
  const childID = e.target.id;
  

await contractCall('closeDonation',[childID], 0);


location.reload((true));
renderChild();
$('#loader').hide();
});