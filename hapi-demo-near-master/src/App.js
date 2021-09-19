import 'regenerator-runtime/runtime'
import React from 'react'
import { login, logout } from './utils'
import './global.css'

import getConfig from './config'
const { networkId } = getConfig(process.env.NODE_ENV || 'development')

export default function App() {
  // use React Hooks to store category in component state
  const [category, set_category] = React.useState("")
  const [account_id, set_account_id] = React.useState("")

  // after submitting the form, we want to show Notification
  const [showNotification, setShowNotification] = React.useState(false)

  const allCategories = [
      "None",
      "Safe",
      "WalletService",
      "MerchantService",
      "MiningPool",
      "LowRiskExchange",
      "MediumRiskExchange",
      "DeFi",
      "OTCBroker",
      "ATM",
      "Gambling",
      "IllicitOrganization",
      "Mixer",
      "DarknetService",
      "Scam",
      "Ransomware",
      "Theft",
      "TerroristFinancing",
      "Sanctions",
      "ChildAbuse"
  ];

  // The useEffect hook can be used to fire side-effects during render
  // Learn more: https://reactjs.org/docs/hooks-intro.html
  React.useEffect(
    () => {
      // in this case, we only care to query the contract when signed in
      if (window.walletConnection.isSignedIn()) {

        console.log("Logged in");
      }
    },

    // The second argument to useEffect tells React when to re-run the effect
    // Use an empty array to specify "only run on first render"
    // This works because signing into NEAR Wallet reloads the page
    []
  )

  // if not signed in, return early with sign-in prompt
  if (!window.walletConnection.isSignedIn()) {
    return (
      <main>
        <h1>Welcome to NEAR!</h1>
        <p>
          To make use of the NEAR blockchain, you need to sign in. The button
          below will sign you in using NEAR Wallet.
        </p>
        <p>
          By default, when your app runs in "development" mode, it connects
          to a test network ("testnet") wallet. This works just like the main
          network ("mainnet") wallet, but the NEAR Tokens on testnet aren't
          convertible to other currencies – they're just for testing!
        </p>
        <p>
          Go ahead and click the button below to try it out:
        </p>
        <p style={{ textAlign: 'center', marginTop: '2.5em' }}>
          <button onClick={login}>Sign in</button>
        </p>
      </main>
    )
  }

  return (
    // use React Fragment, <>, to avoid wrapping elements in unnecessary divs
    <>
      <button className="link" style={{ float: 'right' }} onClick={logout}>
        Sign out
      </button>
      <main>
        <h1>
          <label
            htmlFor="account_id"
          >
              NEAR HAPI APP
          </label>
          {' '/* React trims whitespace around tags; insert literal space character when needed */}
          
        </h1>
        <form onSubmit={async event => {
          event.preventDefault()

          // get elements from the form using their id attribute
          const { fieldset } = event.target.elements

          // disable the form while the value gets updated on-chain
          fieldset.disabled = true

          try {
            // make an update call to the smart contract
            await window.contract.report_address({
              // pass the value that the user entered in the category field
              account_id: account_id,
              category: category
            })
          } catch (e) {
            alert(
              'Something went wrong! ' +
              'Maybe you need to sign out and back in? ' +
              'Check your browser console for more info.'
            )
            throw e
          } finally {
            // re-enable the form, whether the call succeeded or failed
            fieldset.disabled = false
          }

          // update local `category` variable to match persisted value
          set_category(category)

          // show Notification
          setShowNotification(true)

          // remove Notification again after css animation completes
          // this allows it to be shown again next time the form is submitted
          setTimeout(() => {
            setShowNotification(false)
          }, 11000)
        }}>
          <fieldset id="fieldset">
            <label
              htmlFor="account_id"
              style={{
                display: 'block',
                color: 'var(--gray)',
                marginBottom: '0.5em'
              }}
            >
              Set report to address:
            </label>
            <div style={{ display: 'flex' }}>
              <input
                autoComplete="off"
                defaultValue={account_id}
                placeholder="account_id"
                id="account_id"
                onChange={e => {
                    set_account_id(e.target.value);
                }}
              />

              <select
                  name="category"
                  id="category"
                  onChange={e => set_category(e.target.value)}
                  defaultValue={category}
                  style={{ flex: 1 }}
              >
                  {allCategories.map((category)=> <option value={category} key={category}>{category}</option>)}
              </select>
            </div>
            <div>
              <button
                    onClick={async (e) => {
                        e.preventDefault();
                        await window.contract.get_address_category({
                            account_id: account_id
                        }).then(category => alert(category));
                    }}
                >
                    Load
              </button>

              <button>
                  Save
              </button>
            </div>

          </fieldset>
        </form>
        <ol>
          <li>
            Look in <code>src/App.js</code> and <code>src/utils.js</code> – you'll see <code>get_address_category</code> and <code>report_address</code> being called on <code>contract</code>. What's this?
          </li>
          <li>
            Ultimately, this <code>contract</code> code is defined in <code>contract/src/lib.rs</code> – this is the source code for your <a target="_blank" rel="noreferrer" href="https://docs.near.org/docs/roles/developer/contracts/intro">smart contract</a>.</li>
          <li>
            When you run <code>yarn dev</code>, the code in <code>contract/src/lib.rs</code> gets deployed to the NEAR testnet. You can see how this happens by looking in <code>package.json</code> at the <code>scripts</code> section to find the <code>dev</code> command.</li>
        </ol>
        <hr />
        <p>
          To keep learning, check out <a target="_blank" rel="noreferrer" href="https://docs.near.org">the NEAR docs</a> or look through some <a target="_blank" rel="noreferrer" href="https://examples.near.org">example apps</a>.
        </p>
      </main>
      {showNotification && <Notification />}
    </>
  )
}

// this component gets rendered by App after the form is submitted
function Notification() {
  const urlPrefix = `https://explorer.${networkId}.near.org/accounts`
  return (
    <aside>
      <a target="_blank" rel="noreferrer" href={`${urlPrefix}/${window.accountId}`}>
        {window.accountId}
      </a>
      {' '/* React trims whitespace around tags; insert literal space character when needed */}
      called method: 'report_address' in contract:
      {' '}
      <a target="_blank" rel="noreferrer" href={`${urlPrefix}/${window.contract.contractId}`}>
        {window.contract.contractId}
      </a>
      <footer>
        <div>✔ Succeeded</div>
        <div>Just now</div>
      </footer>
    </aside>
  )
}
