import React, { useEffect, useState } from 'react'
import axios from '../utils/axios'

export default function Store() {
  const [items, setItems] = useState([])
  const [purchases, setPurchases] = useState([])

  useEffect(() => {
    axios.get('/store/').then(res => setItems(res.data))
    axios.get('/purchases/').then(res => setPurchases(res.data))
  }, [])

  const handleBuy = async (itemId) => {
    try {
      await axios.post('/purchases/buy/', { item_id: itemId })
      alert('Purchase successful!')
      const res = await axios.get('/purchases/')
      setPurchases(res.data)
    } catch (e) {
      alert('Not enough Honor or already owned.')
    }
  }

  const hasPurchased = (itemId) =>
    purchases.some(p => p.item.id === itemId)

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Honor Store</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {items.map(item => (
          <div key={item.id} className="border rounded shadow p-4 text-center">
            {item.image && <img src={item.image} alt={item.name} className="w-32 h-32 mx-auto mb-2 object-cover rounded" />}
            <h3 className="text-lg font-semibold">{item.name}</h3>
            <p className="text-sm text-gray-600">{item.description}</p>
            <p className="text-md font-bold text-purple-700 my-2">{item.cost} Honor</p>
            <button
              onClick={() => handleBuy(item.id)}
              disabled={hasPurchased(item.id)}
              className={`${hasPurchased(item.id) ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'} text-white px-4 py-2 rounded mt-2`}
            >
              {hasPurchased(item.id) ? 'Purchased' : 'Buy'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}