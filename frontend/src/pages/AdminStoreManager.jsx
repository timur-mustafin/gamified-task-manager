import React, { useEffect, useState } from 'react'
import axios, { mediaUrl } from '../utils/axios'
import { useAlert } from '../context/AlertContext'

export default function AdminStoreManager() {
  const { notify } = useAlert()
  const [items, setItems] = useState([])
  const [editingItem, setEditingItem] = useState(null)
  const [newItem, setNewItem] = useState({ name: '', description: '', cost: 0, image: null })

  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
    const res = await axios.get('/store/')
    setItems(res.data)
  }

  const handleFileChange = (e) => {
    setNewItem({ ...newItem, image: e.target.files[0] })
  }

  const handleCreate = async () => {
    const form = new FormData()
    form.append('name', newItem.name)
    form.append('description', newItem.description)
    form.append('cost', newItem.cost)
    if (newItem.image) form.append('image', newItem.image)
  
    try {
      await axios.post('/store/', form)
      setNewItem({ name: '', description: '', cost: 0, image: null })
      fetchItems()
      notify('Item created!')
    } catch (err) {
      console.error('🔴 Backend error:', err.response?.data || err)
      notify('Failed to create item')
    }
  }
  

  const handleUpdate = async () => {
    const form = new FormData()
    form.append('name', editingItem.name)
    form.append('description', editingItem.description)
    form.append('cost', editingItem.cost)
    if (editingItem.image instanceof File) {
      form.append('image', editingItem.image)
    }

    await axios.put(`/store/${editingItem.id}/`, form)
    setEditingItem(null)
    fetchItems()
    notify('Item updated!')
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this item?')) return
    await axios.delete(`/store/${id}/`)
    fetchItems()
    notify('Item deleted!')
  }

  return (
    <div className="p-8 mt-[1.5rem] max-w-5xl mx-auto bg-surface text-main dark:bg-surface-dark dark:text-main-dark rounded-lg shadow-soft space-y-6">
      <h1 className="text-2xl font-bold">🛍️ Store Manager</h1>

      <div className="space-y-4">
        {items.map(item => (
          <div key={item.id} className="border p-4 rounded space-y-2">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">{item.name}</h2>
              <div className="flex gap-2">
                <button onClick={() => setEditingItem(item)} className="text-blue-600 hover:underline">Edit</button>
                <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:underline">Delete</button>
              </div>
            </div>
            <p className="text-sm">{item.description}</p>
            <p className="text-sm">🎖️ {item.cost} Honor</p>
            {item.image && (
              <img
                src={item.image.startsWith('http') ? item.image : `${mediaUrl}${item.image}`}
                alt="item"
                className="w-32 rounded"
              />
            )}
          </div>
        ))}
      </div>

      {/* Create / Edit Form */}
      <div className="mt-8 border-t pt-4">
        <h2 className="text-lg font-semibold">{editingItem ? 'Edit Item' : 'Add New Item'}</h2>
        <div className="grid gap-2 mt-2">
          <input
            placeholder="Title"
            value={editingItem?.name ?? newItem.name}
            onChange={e =>
              editingItem
                ? setEditingItem({ ...editingItem, name: e.target.value })
                : setNewItem({ ...newItem, name: e.target.value })
            }
            className="p-2 border rounded"
          />
          <textarea
            placeholder="Description"
            value={editingItem?.description ?? newItem.description}
            onChange={e =>
              editingItem
                ? setEditingItem({ ...editingItem, description: e.target.value })
                : setNewItem({ ...newItem, description: e.target.value })
            }
            className="p-2 border rounded"
          />
          <input
            type="number"
            placeholder="Cost in Honor"
            value={editingItem?.cost ?? newItem.cost}
            onChange={e =>
              editingItem
                ? setEditingItem({ ...editingItem, cost: e.target.value })
                : setNewItem({ ...newItem, cost: e.target.value })
            }
            className="p-2 border rounded"
          />
          <input
            type="file"
            onChange={e =>
              editingItem
                ? setEditingItem({ ...editingItem, image: e.target.files[0] })
                : handleFileChange(e)
            }
            className="p-2 border rounded"
          />
          <button
            onClick={editingItem ? handleUpdate : handleCreate}
            className="bg-button text-buttonText dark:bg-button-dark dark:text-buttonText-dark px-4 py-2 rounded shadow hover:bg-buttonHover dark:hover:bg-button-hover-dark"
          >
            {editingItem ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}
