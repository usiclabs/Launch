import {CHAIN_LABELS,isChainKey} from "../chainKeys.ts";
export function creatorKit(chain:string,token:string,name:string,symbol:string,url:string){
 if(!isChainKey(chain)||!/^0x[0-9a-f]{40}$/i.test(token))return null;
 const identity={platform:"LAUNCH",name,symbol,network:CHAIN_LABELS[chain],contract:token,url};
 return {facts:identity,announcement:`Meet ${name} ($${symbol}) on ${CHAIN_LABELS[chain]}.\n\nToken contract: ${token}\n\nExplore the token on LAUNCH:\n${url}`};
}
export function recoveryAdvice(message:string):{title:string;steps:string[]} {
 const text=message.toLowerCase();
 if(/timeout|timed out|rpc|network|fetch|confirmation/.test(text))return {title:"Check the submitted transaction first",steps:["Open your saved transaction or wallet activity and check its explorer record.","An RPC timeout does not mean the transaction failed. Do not submit a replacement launch or trade until its status is clear.","Check Network status below. Refreshing the page does not cancel an onchain transaction."]};
 if(/cancelled|canceled|rejected|denied/.test(text))return {title:"Review your wallet activity",steps:["Check whether any earlier approval or transaction was already submitted.","If nothing was submitted, reopen the review when you are ready. Rejecting a wallet prompt does not revoke approvals already confirmed."]};
 if(/gas|funds|balance|not enough/.test(text))return {title:"Check funds on the selected network",steps:["Confirm the connected wallet and selected network match your intended action.","Keep enough native gas currency alongside the amount you plan to spend. Token balances on another network cannot pay this network’s gas.","If the balance could not load, check the explorer before adding funds or retrying."]};
 if(/slippage|price moved|minimum|toolittlereceived|amountout/.test(text))return {title:"Refresh and review the trade",steps:["Request a fresh quote and review the minimum received and price impact.","Consider a smaller trade. Increasing slippage allows a worse execution price; it is not a guaranteed fix.","Check the original transaction status before submitting again."]};
 return {title:"Review before retrying",steps:["Check saved transactions and wallet activity for a submitted hash.","If it reverted, review the explorer reason and current settings. Confirmed reverted transactions can still cost network gas.","If the status is unknown, wait for confirmation rather than submitting the action again."]};
}
