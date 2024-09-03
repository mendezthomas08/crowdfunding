
import {useEffect,useState} from "react"
import {Connection,PublicKey,SystemProgram,clusterApiUrl} from '@solana/web3.js'
import{Program,AnchorProvider,web3,utils,BN} from '@project-serum/anchor'
import idl from './crowdfunding.json'
import './App.css';
import { publicKey } from "@project-serum/anchor/dist/cjs/utils";

function App() {
  const [walletAddress,setWalletAddress] =useState(null)
  const [campaigns,setCampaigns] = useState([])
  const programId = new PublicKey(idl.address)
  const network = clusterApiUrl('devnet')
  const opts = {
    preflightCommitment: "processed"
  }
  const getProvider= async()=>{
      const connection = new Connection(network,opts.preflightCommitment)
      const provider = new AnchorProvider(connection,window.solana,opts.preflightCommitment)
       return provider
    }
  const checkIfWalletIsConnected = async ()=>{
    try{
      const {solana} = window
      if(solana){
         console.log("Phantom wallet found!")
         const response = await solana.connect({
          onlyIfTrusted: true
         })
          console.log("connected with public key "+ response.publicKey.toString())
          setWalletAddress(response.publicKey.toString())
        }else{
          alert("Phantom Wallet not found! Get a Phantom wallet")
        }
    }catch(error){
      console.log(error)
    }
  }
  const connectWallet = async()=>{
      const {solana} = window
      if(solana){
        const response = await solana.connect()
        console.log("Connected with public key" + response.publicKey.toString())
        setWalletAddress(response.publicKey.toString())
      }
  }
  const getCampaigns = async()=>{
      const connection = new Connection(network,opts.preflightCommitment)
      const provider = getProvider()
      const program = new Program(idl,programId,provider)
       Promise.all(
        (await connection.getProgramAccounts(programId)).map(
          async (campaign)=>({
           ...(await program.account.campaign.fetch(campaign.publicKey)),
               pubKey: campaign.pubKey 
             
        })
      ) 
    ).then((camapaigns)=> setCampaigns(camapaigns))
  }

  const createCampaign = async()=>{
    try{
       
        const provider = await getProvider();
      console.log("Provider:", provider);
      
       const program = new Program(idl, programId, provider);
        console.log("Program:", program);
        
        console.log("2.+++++++++++++" + program)
        const [campaign,bump] = new PublicKey.findProgramAddress([
          utils.bytes.utf8.encode('CAMPAIGN_DEMO'),
          provider.wallet.publicKey.toBuffer()
        ],
      program.programId)
      console.log("3.++++++++++++++++++++++")
      await program.rpc.create('campaign name','campaign description',{
        accounts:{
          campaign,
          user:  provider.wallet.publicKey,
          SystemProgram: SystemProgram.programId
        }
      })
      console.log("Created a new campaign with address " + campaign.toString())
    }catch(error){
      console.error("Unable to create a campaign" + error)
    }
  }
  const donate = async (publicKey)=>{
    try{
       const provider = getProvider()
       const program = new Program(idl,programId,provider)
       await program.rpc.donate(new BN(20 * web3.LAMPORTS_PER_SOL),
      {
        accounts: {
          campaign: publicKey,
          user: provider.wallet.pubKey,
          SystemProgram: SystemProgram.programId
        }
      })
      console.log("Donated some money to: "+ publicKey.toString())
      getCampaigns()
    }catch(error){
      console.error("Unable to donate",error)
    }
  }
  const withdraw = async (publicKey)=>{
    try{
       const provider = getProvider()
       const program = new Program(idl,programId,provider)
       await program.rpc.withdraw(new BN(20 * web3.LAMPORTS_PER_SOL),
      {
        accounts: {
          campaign: publicKey,
          user: provider.wallet.pubKey
        }
      })
      console.log("Withdrew some money from: "+ publicKey.toString())
      getCampaigns()
    }catch(error){
      console.error("Unable to withdraw",error)
    }
  }
  
  useEffect(()=>{
    const onLoad = async ()=>{
      await checkIfWalletIsConnected()
    }
    window.addEventListener('load',onLoad)
    return ()=>window.removeEventListener('load',onLoad)
  },[])
  const renderConnectedContainer = ()=>(
    <div>
    <button onClick={createCampaign}>Create a campaign</button>
    <button onClick={getCampaigns}>Get a campaign</button>
    <br></br>
    {campaigns.map((campaign)=><div>
      <p>CampaignID: {campaign.pubKey.toString()}</p>
      <p>Balance : {(campaign.amountDonated/web3.LAMPORTS_PER_SOL).toString()}</p>
      <p>{campaign.name}</p>
      <p>{campaign.description}</p>
      <button onClick={()=>donate(campaign.pubKey)}>Donate</button>
      <button onClick={()=>withdraw(campaign.pubKey)}>Donate</button>
      </div>)}
   </div>
  )

  
  return (
    <div className="App">
       {!walletAddress && <button onClick={connectWallet}>Connect Wallet</button>}

       {walletAddress && {renderConnectedContainer}}
    </div>
  );
}

export default App;
