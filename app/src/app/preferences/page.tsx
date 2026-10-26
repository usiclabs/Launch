import {WorkspaceBackup} from "@/components/launchpad/WorkspaceUpgrades";
import {Preferences} from "@/components/launchpad/SuiteTools";
export const metadata={title:"Display preferences",alternates:{canonical:"/preferences"}};
export default function Page(){return <main className="bb-market bb-mid bb-page py-8"><Preferences/><WorkspaceBackup/></main>;}
