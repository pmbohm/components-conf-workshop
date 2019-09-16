// src/App.js
import React, { useEffect, useReducer } from 'react'
import { API, graphqlOperation } from 'aws-amplify'
import { withAuthenticator } from 'aws-amplify-react'
import { listCoins } from './graphql/queries'
import { createCoin as CreateCoin } from './graphql/mutations'
import { deleteCoin as DeleteCoin } from './graphql/mutations'

// import uuid to create a unique client ID
import uuid from 'uuid/v4'

// import the subscription
import { onCreateCoin } from './graphql/subscriptions'
import { onDeleteCoin } from './graphql/subscriptions'

const CLIENT_ID = uuid();

// create initial state
const initialState = {
  name: '', price: '', symbol: '', coins: []
};

// update reducer
function reducer(state, action) {
  switch(action.type) {
    case 'SETCOINS':
      return { ...state, coins: action.coins };
    case 'SETINPUT':
      return { ...state, [action.key]: action.value };
    // new �
    case 'ADDCOIN':
      return { ...state, coins: [...state.coins, action.coin] };
    case 'DELETECOIN':
      return { ...state, coins: state.coins.filter(c => c.id !== action.coin.id) };
    default:
      return state
  }
}


function App() {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    getData()
  }, []);

  async function getData() {
    try {
      const coinData = await API.graphql(graphqlOperation(listCoins));
      //console.log('data from API: ', coinData);
      dispatch({ type: 'SETCOINS', coins: coinData.data.listCoins.items})
    } catch (err) {
      console.log('error fetching data..', err)
    }
  }

  async function deleteCoin(coin) {
    try {
      if (coin) {
        console.log('coin:', coin);
        dispatch({ type: 'DELETECOIN', coin});
        await API.graphql(graphqlOperation(DeleteCoin, { input: {id: coin.id} }));
      }
    } catch (err) {
      console.log('error deleting coin..', err)
    }
  }

  async function createCoin() {
    const { name, price, symbol } = state;
    if (name === '' || price === '' || symbol === '') return;
    const coin = {
      name, price: parseFloat(price), symbol, clientId: CLIENT_ID
    };
    let coins = state.coins;
    if (! state.coins.some(v => (v.name === coin.name || v.symbol === coin.symbol))) {
      coins = [...state.coins, coin];
      console.log('coins:', coins);
    }

    dispatch({ type: 'SETCOINS', coins });

    
    try {
      await API.graphql(graphqlOperation(CreateCoin, { input: coin }));
      console.log('item created!')
    } catch (err) {
      console.log('error creating coin...', err)
    }
  }

  // change state then user types into input
  function onChange(e) {
    dispatch({ type: 'SETINPUT', key: e.target.name, value: e.target.value })
  }


  // subscribe in useEffect
  useEffect(() => {
    const subscription = API.graphql(graphqlOperation(onCreateCoin)).subscribe({
      next: (eventData) => {
        const coin = eventData.value.data.onCreateCoin;
        if (coin.clientId === CLIENT_ID) return;
        dispatch({ type: 'ADDCOIN', coin  })
      }
    });
    return () => subscription.unsubscribe()
  }, []);

  useEffect(() => {
    const subscription = API.graphql(graphqlOperation(onDeleteCoin)).subscribe({
      next: (eventData) => {
        const coin = eventData.value.data.onDeleteCoin;
        if (coin.clientId === CLIENT_ID) return;
        dispatch({ type: 'DELETECOIN', coin  })
      }
    });
    return () => subscription.unsubscribe()
  }, []);


  // add UI with event handlers to manage user input
  return (
    <div className="app-body m-4" >
      <main className="main">
        <input
          name='name'
          placeholder='name'
          onChange={onChange}
          value={state.name}
        />
        <input
          name='price'
          placeholder='price'
          onChange={onChange}
          value={state.price}
        />
        <input
          name='symbol'
          placeholder='symbol'
          onChange={onChange}
          value={state.symbol}
        />
        <button onClick={createCoin} className="m1" >Create Coin</button>
      </main>

      <div >
        {
          state.coins.map((c, i) => (

                <div className="card mr-1" key={i} style={{width: "10rem"}} >
                  <div className="card-body">
                    <h2 className="card-title" >{c.name}</h2>
                    <h4>{c.symbol}</h4>
                    <p>{c.price}</p>
                    <button onClick={() => deleteCoin(c)}>Delete Coin</button>
                  </div>
                </div>
          ))
        }
      </div>
    </div>
  )
}

export default withAuthenticator(App, { includeGreetings: true })
