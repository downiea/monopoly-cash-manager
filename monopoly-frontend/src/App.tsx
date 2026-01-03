import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Users, Building2, Train, Zap, ParkingCircle, Banknote, Home, Hotel, RefreshCw, ArrowRightLeft, Plus, CircleDollarSign, Receipt, Settings, MoreHorizontal, ChevronRight, ChevronUp, ChevronDown, Play } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const DEFAULT_PREDEFINED_AMOUNTS = [10, 15, 50, 100, 200]

function loadPredefinedAmounts(): number[] {
  try {
    const saved = localStorage.getItem('monopoly_predefined_amounts')
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed) && parsed.every(n => typeof n === 'number')) {
        return parsed
      }
    }
    } catch {
      // Ignore parse errors, use defaults
    }
    return DEFAULT_PREDEFINED_AMOUNTS
}

function savePredefinedAmounts(amounts: number[]) {
  localStorage.setItem('monopoly_predefined_amounts', JSON.stringify(amounts))
}

interface Property {
  property_id: string
  name: string
  type: 'property' | 'station' | 'utility'
  color: string
  purchase_cost: number
  mortgage_value: number
  house_cost?: number
  rent?: Record<string, number>
  houses?: number
  has_hotel?: boolean
  is_mortgaged?: boolean
}

interface Player {
  id: number
  name: string
  cash: number
  properties: Property[]
}

interface Transaction {
  id: number
  timestamp: string
  type: string
  from_entity: string
  to_entity: string
  amount: number
  description: string
}

interface GameState {
  players: Player[]
  free_parking_pot: number
  available_properties: Property[]
  version: string
  versions: string[]
  turn_order: number[]
  current_turn_index: number
}

const COLOR_MAP: Record<string, string> = {
  brown: 'bg-amber-800',
  light_blue: 'bg-sky-300',
  pink: 'bg-pink-400',
  orange: 'bg-orange-500',
  red: 'bg-red-600',
  yellow: 'bg-yellow-400',
  green: 'bg-green-600',
  dark_blue: 'bg-blue-800',
  station: 'bg-gray-700',
  utility: 'bg-gray-500',
}

const COLOR_TEXT: Record<string, string> = {
  brown: 'text-white',
  light_blue: 'text-gray-800',
  pink: 'text-white',
  orange: 'text-white',
  red: 'text-white',
  yellow: 'text-gray-800',
  green: 'text-white',
  dark_blue: 'text-white',
  station: 'text-white',
  utility: 'text-white',
}

const BOARD_ORDER = [
  'old_kent_road',
  'whitechapel_road',
  'kings_cross_station',
  'angel_islington',
  'euston_road',
  'pentonville_road',
  'pall_mall',
  'electric_company',
  'whitehall',
  'northumberland_avenue',
  'marylebone_station',
  'bow_street',
  'marlborough_street',
  'vine_street',
  'strand',
  'fleet_street',
  'trafalgar_square',
  'fenchurch_street_station',
  'leicester_square',
  'coventry_street',
  'water_works',
  'piccadilly',
  'regent_street',
  'oxford_street',
  'bond_street',
  'liverpool_street_station',
  'park_lane',
  'mayfair',
]

const ORDER_INDEX: Record<string, number> = BOARD_ORDER.reduce((acc, id, idx) => {
  acc[id] = idx
  return acc
}, {} as Record<string, number>)

const COLOR_GROUPS: Record<string, string[]> = {
  brown: ['old_kent_road', 'whitechapel_road'],
  light_blue: ['angel_islington', 'euston_road', 'pentonville_road'],
  pink: ['pall_mall', 'whitehall', 'northumberland_avenue'],
  orange: ['bow_street', 'marlborough_street', 'vine_street'],
  red: ['strand', 'fleet_street', 'trafalgar_square'],
  yellow: ['leicester_square', 'coventry_street', 'piccadilly'],
  green: ['regent_street', 'oxford_street', 'bond_street'],
  dark_blue: ['park_lane', 'mayfair'],
}

function App() {
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [newPlayerName, setNewPlayerName] = useState('')
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null)
  const [transferAmount, setTransferAmount] = useState('')
  const [transferFrom, setTransferFrom] = useState<string>('')
  const [transferTo, setTransferTo] = useState<string>('')
  const [diceRoll, setDiceRoll] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [transferPropertyTo, setTransferPropertyTo] = useState<string>('')
  const [transferPropertyPrice, setTransferPropertyPrice] = useState('')
  
  const [transferDialogOpen, setTransferDialogOpen] = useState(false)
  const [addPlayerDialogOpen, setAddPlayerDialogOpen] = useState(false)
  const [freeParkingDialogOpen, setFreeParkingDialogOpen] = useState(false)
  const [payRentDialogOpen, setPayRentDialogOpen] = useState(false)
  const [rentPropertyId, setRentPropertyId] = useState<string>('')
  const [rentOwnerId, setRentOwnerId] = useState<number | null>(null)
  const [rentDiceRoll, setRentDiceRoll] = useState('')
  const [payFineDialogOpen, setPayFineDialogOpen] = useState(false)
  const [payFinePlayerId, setPayFinePlayerId] = useState<number | null>(null)
  const [payFromBankDialogOpen, setPayFromBankDialogOpen] = useState(false)
  const [payFromBankPlayerId, setPayFromBankPlayerId] = useState<number | null>(null)
  const [payFromBankAmount, setPayFromBankAmount] = useState('')
    const [payEveryoneDialogOpen, setPayEveryoneDialogOpen] = useState(false)
    const [payEveryonePlayerId, setPayEveryonePlayerId] = useState<number | null>(null)
    const [payEveryoneAmount, setPayEveryoneAmount] = useState('')
    const [receiveAllDialogOpen, setReceiveAllDialogOpen] = useState(false)
    const [receiveAllPlayerId, setReceiveAllPlayerId] = useState<number | null>(null)
    const [receiveAllAmount, setReceiveAllAmount] = useState('')
    const [transactions, setTransactions] = useState<Transaction[]>([])
  
    const [configDialogOpen, setConfigDialogOpen] = useState(false)
    const [predefinedAmounts, setPredefinedAmounts] = useState<number[]>(loadPredefinedAmounts)
    const [newAmount, setNewAmount] = useState('')
  
    const [actionsDialogOpen, setActionsDialogOpen] = useState(false)
    const [actionsPlayerId, setActionsPlayerId] = useState<number | null>(null)
    const [actionsTargetPlayer, setActionsTargetPlayer] = useState<string>('')
    const [payFineAmount, setPayFineAmount] = useState('')

    const fetchGameState= useCallback(async () => {
    try {
      const [stateResponse, transactionsResponse] = await Promise.all([
        fetch(`${API_URL}/game/state`),
        fetch(`${API_URL}/transactions`)
      ])
      const stateData = await stateResponse.json()
      const transactionsData = await transactionsResponse.json()
      setGameState(stateData)
      setTransactions(transactionsData.transactions || [])
      setError(null)
      } catch {
        setError('Failed to fetch game state')
      }
    }, [])

  useEffect(() => {
    fetchGameState()
  }, [fetchGameState])

  const handleApiCall = async (endpoint: string, method: string = 'POST', body?: object) => {
    setLoading(true)
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.detail || 'Request failed')
      }
      await fetchGameState()
      setError(null)
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const addPlayer = async () => {
    if (!newPlayerName.trim()) return
    await handleApiCall('/players', 'POST', { name: newPlayerName })
    setNewPlayerName('')
    setAddPlayerDialogOpen(false)
  }

  const removePlayer = async (playerId: number) => {
    await handleApiCall(`/players/${playerId}`, 'DELETE')
  }

  const buyProperty = async (playerId: number, propertyId: string) => {
    await handleApiCall('/properties/buy', 'POST', { player_id: playerId, property_id: propertyId })
  }

  const mortgageProperty = async (playerId: number, propertyId: string) => {
    await handleApiCall('/properties/mortgage', 'POST', { player_id: playerId, property_id: propertyId })
  }

  const unmortgageProperty = async (playerId: number, propertyId: string) => {
    await handleApiCall('/properties/unmortgage', 'POST', { player_id: playerId, property_id: propertyId })
  }

  const buildHouse = async (playerId: number, propertyId: string) => {
    await handleApiCall('/properties/build', 'POST', { player_id: playerId, property_id: propertyId })
  }

  const sellBuilding = async (playerId: number, propertyId: string) => {
    await handleApiCall('/properties/sell-building', 'POST', { player_id: playerId, property_id: propertyId })
  }

  const sellProperty = async (playerId: number, propertyId: string) => {
    await handleApiCall('/properties/sell', 'POST', { player_id: playerId, property_id: propertyId })
  }

  const transferProperty = async (fromPlayerId: number, toPlayerId: number, propertyId: string, salePrice?: number) => {
    await handleApiCall('/properties/transfer', 'POST', {
      from_player_id: fromPlayerId,
      to_player_id: toPlayerId,
      property_id: propertyId,
      sale_price: salePrice,
    })
  }

  const transferMoney = async () => {
    const amount = parseInt(transferAmount)
    if (isNaN(amount) || amount <= 0) return

    await handleApiCall('/transfer', 'POST', {
      from_player_id: transferFrom === 'bank' ? null : parseInt(transferFrom),
      to_player_id: transferTo === 'bank' || transferTo === 'fine' ? null : parseInt(transferTo),
      amount,
      is_fine: transferTo === 'fine',
    })
    setTransferAmount('')
    setTransferFrom('')
    setTransferTo('')
    setTransferDialogOpen(false)
  }

  const passGo = async (playerId: number) => {
    await handleApiCall('/transfer', 'POST', {
      from_player_id: null,
      to_player_id: playerId,
      amount: 200,
      is_fine: false,
    })
  }

    const payRent= async (fromPlayerId: number, propertyId: string, dice?: number) => {
    await handleApiCall('/rent/pay', 'POST', {
      from_player_id: fromPlayerId,
      property_id: propertyId,
      dice_roll: dice,
    })
  }

  const handlePayRent = async () => {
    if (!selectedPlayer || !rentPropertyId) return
    const prop = gameState?.players.flatMap(p => p.properties).find(p => p.property_id === rentPropertyId)
    const dice = prop?.type === 'utility' ? parseInt(rentDiceRoll) : undefined
    if (prop?.type === 'utility' && !dice) {
      setError('Dice roll required for utility rent')
      return
    }
    await payRent(selectedPlayer, rentPropertyId, dice)
    setPayRentDialogOpen(false)
    setRentPropertyId('')
    setRentOwnerId(null)
    setRentDiceRoll('')
    setSelectedPlayer(null)
  }

  const openPayRentDialog = (propertyId: string, ownerId: number) => {
    setRentPropertyId(propertyId)
    setRentOwnerId(ownerId)
    setRentDiceRoll('')
    const currentTurnPlayerId = gameState?.turn_order[gameState?.current_turn_index]
    setSelectedPlayer(currentTurnPlayerId !== ownerId ? currentTurnPlayerId ?? null : null)
    setPayRentDialogOpen(true)
  }

  const collectFreeParking = async (playerId: number) => {
    await handleApiCall('/free-parking/collect', 'POST', { player_id: playerId })
    setFreeParkingDialogOpen(false)
  }

  const resetGame = async () => {
    await handleApiCall('/game/reset', 'POST')
  }

  const setGameVersion = async (version: string) => {
    await handleApiCall('/game/version', 'POST', { version })
  }

  const getPropertyIcon = (type: string) => {
    switch (type) {
      case 'station': return <Train className="h-4 w-4" />
      case 'utility': return <Zap className="h-4 w-4" />
      default: return <Building2 className="h-4 w-4" />
    }
  }

  const getBuildingDisplay = (prop: Property) => {
    if (prop.has_hotel) return <Hotel className="h-4 w-4 text-red-500" />
    if (prop.houses && prop.houses > 0) {
      return (
        <div className="flex gap-0.5">
          {Array.from({ length: prop.houses }).map((_, i) => (
            <Home key={i} className="h-3 w-3 text-green-600" />
          ))}
        </div>
      )
    }
    return null
  }

  const sortPropertiesByBoardOrder = (properties: Property[]) => {
    return [...properties].sort((a, b) => {
      const orderA = ORDER_INDEX[a.property_id] ?? 999
      const orderB = ORDER_INDEX[b.property_id] ?? 999
      return orderA - orderB
    })
  }

  const getOwnedColorGroups = (properties: Property[]) => {
    const ownedColors: string[] = []
    for (const [color, propertyIds] of Object.entries(COLOR_GROUPS)) {
      const ownedInColor = properties.filter(p => propertyIds.includes(p.property_id))
      if (ownedInColor.length === propertyIds.length) {
        ownedColors.push(color)
      }
    }
    return ownedColors
  }

  const separatePropertiesByType = (properties: Property[]) => {
    const regularProps = properties.filter(p => p.type === 'property')
    const stations = properties.filter(p => p.type === 'station')
    const utilities = properties.filter(p => p.type === 'utility')
    return {
      properties: sortPropertiesByBoardOrder(regularProps),
      stations: sortPropertiesByBoardOrder(stations),
      utilities: sortPropertiesByBoardOrder(utilities)
    }
  }

  const getRentDisplay = (prop: Property, allPlayerProperties: Property[]) => {
    if (prop.is_mortgaged) return 'Mortgaged'
    
    if (prop.type === 'station') {
      const stationCount = allPlayerProperties.filter(p => p.type === 'station').length
      const stationRents: Record<number, number> = { 1: 25, 2: 50, 3: 100, 4: 200 }
      return `£${stationRents[stationCount] || 25}`
    }
    
    if (prop.type === 'utility') {
      const utilityCount = allPlayerProperties.filter(p => p.type === 'utility').length
      return utilityCount === 2 ? '10x dice' : '4x dice'
    }
    
    if (prop.rent) {
      if (prop.has_hotel) return `£${prop.rent['hotel']}`
      if (prop.houses && prop.houses > 0) return `£${prop.rent[prop.houses.toString()]}`
      const ownsColorGroup = getOwnedColorGroups(allPlayerProperties).includes(prop.color)
      const baseRent = prop.rent['0'] || 0
      return ownsColorGroup ? `£${baseRent * 2}` : `£${baseRent}`
    }
    return ''
  }

  const payFine = async (playerId: number, amount: number) => {
    await handleApiCall('/transfer', 'POST', {
      from_player_id: playerId,
      to_player_id: null,
      amount,
      is_fine: true,
    })
    setPayFineDialogOpen(false)
    setPayFinePlayerId(null)
  }

  const openPayFineDialog = (playerId: number) => {
    setPayFinePlayerId(playerId)
    setPayFineDialogOpen(true)
  }

  const payFromBank = async (playerId: number, amount: number) => {
    await handleApiCall('/transfer', 'POST', {
      from_player_id: null,
      to_player_id: playerId,
      amount,
      is_fine: false,
    })
    setPayFromBankDialogOpen(false)
    setPayFromBankPlayerId(null)
    setPayFromBankAmount('')
  }

  const openPayFromBankDialog = (playerId: number) => {
    setPayFromBankPlayerId(playerId)
    setPayFromBankAmount('')
    setPayFromBankDialogOpen(true)
  }

  const payEveryone = async (fromPlayerId: number, amount: number) => {
    if (!gameState) return
    for (const player of gameState.players) {
      if (player.id !== fromPlayerId) {
        await handleApiCall('/transfer', 'POST', {
          from_player_id: fromPlayerId,
          to_player_id: player.id,
          amount,
          is_fine: false,
        })
      }
    }
    setPayEveryoneDialogOpen(false)
    setPayEveryonePlayerId(null)
    setPayEveryoneAmount('')
  }

    const openPayEveryoneDialog = (playerId: number) => {
      setPayEveryonePlayerId(playerId)
      setPayEveryoneAmount('')
      setPayEveryoneDialogOpen(true)
    }

    const receiveFromAll = async (playerId: number, amount: number) => {
      await handleApiCall('/receive-from-all', 'POST', {
        player_id: playerId,
        amount,
      })
      setReceiveAllDialogOpen(false)
      setReceiveAllPlayerId(null)
      setReceiveAllAmount('')
    }

    const openReceiveAllDialog = (playerId: number) => {
      setReceiveAllPlayerId(playerId)
      setReceiveAllAmount('')
      setReceiveAllDialogOpen(true)
    }

    const openActionsDialog = (playerId: number) => {
      setActionsPlayerId(playerId)
      setActionsTargetPlayer('')
      setActionsDialogOpen(true)
    }

    const transferAllCash = async (fromPlayerId: number, toPlayerId: number) => {
      await handleApiCall('/transfer-all-cash', 'POST', {
        from_player_id: fromPlayerId,
        to_player_id: toPlayerId,
      })
      setActionsDialogOpen(false)
    }

    const transferAllProperties = async (fromPlayerId: number, toPlayerId: number) => {
      await handleApiCall('/transfer-all-properties', 'POST', {
        from_player_id: fromPlayerId,
        to_player_id: toPlayerId,
      })
      setActionsDialogOpen(false)
    }

    const sellAllBuildings = async (playerId: number) => {
      await handleApiCall('/sell-all-buildings', 'POST', {
        player_id: playerId,
      })
      setActionsDialogOpen(false)
    }

    const sellAllProperties = async (playerId: number) => {
      await handleApiCall('/sell-all-properties', 'POST', {
        player_id: playerId,
      })
      setActionsDialogOpen(false)
    }

    const cashOut = async (playerId: number) => {
      await handleApiCall('/cash-out', 'POST', {
        player_id: playerId,
      })
      setActionsDialogOpen(false)
    }

    const addPredefinedAmount = () => {
      const amount = parseInt(newAmount)
      if (!isNaN(amount) && amount > 0 && !predefinedAmounts.includes(amount)) {
        const newAmounts = [...predefinedAmounts, amount].sort((a, b) => a - b)
        setPredefinedAmounts(newAmounts)
        savePredefinedAmounts(newAmounts)
        setNewAmount('')
      }
    }

    const removePredefinedAmount = (amount: number) => {
      const newAmounts = predefinedAmounts.filter(a => a !== amount)
      setPredefinedAmounts(newAmounts)
      savePredefinedAmounts(newAmounts)
    }

    const nextTurn = async () => {
      await handleApiCall('/turn/next', 'POST')
    }

    const reorderPlayers = async (newOrder: number[]) => {
      await handleApiCall('/turn/reorder', 'POST', { turn_order: newOrder })
    }

    const movePlayerUp = (playerId: number) => {
      const currentIndex = gameState.turn_order.indexOf(playerId)
      if (currentIndex > 0) {
        const newOrder = [...gameState.turn_order]
        newOrder[currentIndex] = newOrder[currentIndex - 1]
        newOrder[currentIndex - 1] = playerId
        reorderPlayers(newOrder)
      }
    }

    const movePlayerDown = (playerId: number) => {
      const currentIndex = gameState.turn_order.indexOf(playerId)
      if (currentIndex < gameState.turn_order.length - 1) {
        const newOrder = [...gameState.turn_order]
        newOrder[currentIndex] = newOrder[currentIndex + 1]
        newOrder[currentIndex + 1] = playerId
        reorderPlayers(newOrder)
      }
    }

    const getPlayerById = (playerId: number) => {
      return gameState.players.find(p => p.id === playerId)
    }

    if (!gameState) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 to-green-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Banknote className="h-8 w-8" />
            Monopoly Cash Manager
          </h1>
          <div className="flex items-center gap-2 flex-wrap">
            <Select
              value={gameState.version}
              onValueChange={setGameVersion}
              disabled={gameState.players.length > 0}
            >
              <SelectTrigger className="w-32 bg-white">
                <SelectValue placeholder="Version" />
              </SelectTrigger>
              <SelectContent>
                {gameState.versions.map(v => (
                  <SelectItem key={v} value={v}>
                    {v.charAt(0).toUpperCase() + v.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-1 bg-yellow-100 px-3 py-1.5 rounded-md">
              <ParkingCircle className="h-4 w-4 text-yellow-800" />
              <span className="font-bold text-yellow-800">£{gameState.free_parking_pot}</span>
              {gameState.players.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-yellow-800 hover:bg-yellow-200"
                  onClick={() => setFreeParkingDialogOpen(true)}
                >
                  Collect
                </Button>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              className="bg-white"
              onClick={() => setTransferDialogOpen(true)}
            >
              <ArrowRightLeft className="h-4 w-4 mr-1" />
              Transfer
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="bg-white"
              onClick={() => setAddPlayerDialogOpen(true)}
              disabled={gameState.players.length >= 8}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Player
            </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-white"
                      onClick={() => setConfigDialogOpen(true)}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button onClick={fetchGameState} variant="outline" size="sm" disabled={loading} className="bg-white">
                      <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                    <Button onClick={resetGame} variant="destructive" size="sm">
                      Reset Game
                    </Button>
                  </div>
                </div>

        {gameState.turn_order.length > 0 && (
          <div className="bg-white rounded-lg p-3 mb-4 shadow">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-gray-700">Turn Order:</span>
              <div className="flex items-center gap-1 flex-wrap">
                {gameState.turn_order.map((playerId, index) => {
                  const player = getPlayerById(playerId)
                  const isCurrentTurn = index === gameState.current_turn_index
                  return (
                    <div key={playerId} className="flex items-center gap-1">
                      {index > 0 && <ChevronRight className="h-4 w-4 text-gray-400" />}
                      <div className={`flex items-center gap-1 px-2 py-1 rounded ${isCurrentTurn ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-700'}`}>
                        {isCurrentTurn && <Play className="h-3 w-3" />}
                        <span className="text-sm font-medium">{player?.name || 'Unknown'}</span>
                        <div className="flex flex-col">
                          <button
                            onClick={() => movePlayerUp(playerId)}
                            disabled={index === 0}
                            className="p-0 h-3 hover:bg-gray-200 rounded disabled:opacity-30"
                          >
                            <ChevronUp className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => movePlayerDown(playerId)}
                            disabled={index === gameState.turn_order.length - 1}
                            className="p-0 h-3 hover:bg-gray-200 rounded disabled:opacity-30"
                          >
                            <ChevronDown className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              <Button
                size="sm"
                variant="outline"
                className="ml-auto bg-blue-100 hover:bg-blue-200 text-blue-800"
                onClick={nextTurn}
              >
                Next Turn
              </Button>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Banknote className="h-5 w-5" />
                Money Transfer
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600">From</label>
                <Select value={transferFrom} onValueChange={setTransferFrom}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank">Bank</SelectItem>
                    {gameState.players.map(p => (
                      <SelectItem key={p.id} value={p.id.toString()}>{p.name} (£{p.cash})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-gray-600">To</label>
                <Select value={transferTo} onValueChange={setTransferTo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select destination" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank">Bank</SelectItem>
                    <SelectItem value="fine">Fine (Free Parking)</SelectItem>
                    {gameState.players.map(p => (
                      <SelectItem key={p.id} value={p.id.toString()}>{p.name} (£{p.cash})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-gray-600">Amount</label>
                <Input
                  type="number"
                  placeholder="£"
                  value={transferAmount}
                  onChange={e => setTransferAmount(e.target.value)}
                />
              </div>
              <Button onClick={transferMoney} disabled={!transferFrom || !transferTo || !transferAmount} className="w-full">
                Transfer
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={addPlayerDialogOpen} onOpenChange={setAddPlayerDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Add Player
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600">Player Name</label>
                <Input
                  placeholder="Enter player name"
                  value={newPlayerName}
                  onChange={e => setNewPlayerName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addPlayer()}
                />
              </div>
              <div className="text-sm text-gray-500">
                {gameState.players.length}/8 players
              </div>
              <Button onClick={addPlayer} disabled={!newPlayerName.trim()} className="w-full">
                Add Player
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={freeParkingDialogOpen} onOpenChange={setFreeParkingDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ParkingCircle className="h-5 w-5" />
                Collect Free Parking (£{gameState.free_parking_pot})
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              {gameState.players.map(player => (
                <Button
                  key={player.id}
                  onClick={() => collectFreeParking(player.id)}
                  className="w-full"
                  variant="outline"
                >
                  {player.name} collects £{gameState.free_parking_pot}
                </Button>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={payRentDialogOpen} onOpenChange={setPayRentDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CircleDollarSign className="h-5 w-5" />
                Pay Rent
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600">Who is paying rent?</label>
                <Select value={selectedPlayer?.toString() || ''} onValueChange={v => setSelectedPlayer(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select player" />
                  </SelectTrigger>
                  <SelectContent>
                    {gameState.players
                      .filter(p => p.id !== rentOwnerId)
                      .map(p => (
                        <SelectItem key={p.id} value={p.id.toString()}>{p.name} (£{p.cash})</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              {gameState.players.flatMap(p => p.properties).find(p => p.property_id === rentPropertyId)?.type === 'utility' && (
                <div>
                  <label className="text-sm text-gray-600">Dice Roll (required for utilities)</label>
                  <Input
                    type="number"
                    placeholder="2-12"
                    min={2}
                    max={12}
                    value={rentDiceRoll}
                    onChange={e => setRentDiceRoll(e.target.value)}
                  />
                </div>
              )}
              <Button onClick={handlePayRent} disabled={!selectedPlayer} className="w-full">
                Pay Rent
              </Button>
            </div>
          </DialogContent>
        </Dialog>

                <Dialog open={payFineDialogOpen} onOpenChange={setPayFineDialogOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Receipt className="h-5 w-5" />
                        Pay Fine/Tax to Free Parking
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {predefinedAmounts.map(amount => (
                          <Button
                            key={amount}
                            variant="outline"
                            onClick={() => payFinePlayerId && payFine(payFinePlayerId, amount)}
                          >
                            £{amount}
                          </Button>
                        ))}
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Or enter custom amount:</label>
                        <Input
                          type="number"
                          placeholder="£"
                          value={payFineAmount}
                          onChange={e => setPayFineAmount(e.target.value)}
                        />
                      </div>
                      <Button
                        onClick={() => payFinePlayerId && payFineAmount && payFine(payFinePlayerId, parseInt(payFineAmount))}
                        disabled={!payFineAmount}
                        className="w-full"
                      >
                        Pay £{payFineAmount || 0}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={payFromBankDialogOpen} onOpenChange={setPayFromBankDialogOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Banknote className="h-5 w-5" />
                        Receive from Bank
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {predefinedAmounts.map(amount => (
                          <Button
                            key={amount}
                            variant="outline"
                            onClick={() => payFromBankPlayerId && payFromBank(payFromBankPlayerId, amount)}
                          >
                            £{amount}
                          </Button>
                        ))}
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Or enter custom amount:</label>
                        <Input
                          type="number"
                          placeholder="£"
                          value={payFromBankAmount}
                          onChange={e => setPayFromBankAmount(e.target.value)}
                        />
                      </div>
                      <Button
                        onClick={() => payFromBankPlayerId && payFromBankAmount && payFromBank(payFromBankPlayerId, parseInt(payFromBankAmount))}
                        disabled={!payFromBankAmount}
                        className="w-full"
                      >
                        Receive £{payFromBankAmount || 0}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={payEveryoneDialogOpen} onOpenChange={setPayEveryoneDialogOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Pay Everyone
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {predefinedAmounts.map(amount => (
                          <Button
                            key={amount}
                            variant="outline"
                            onClick={() => payEveryonePlayerId && payEveryone(payEveryonePlayerId, amount)}
                          >
                            £{amount}
                          </Button>
                        ))}
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Or enter custom amount per player:</label>
                        <Input
                          type="number"
                          placeholder="£"
                          value={payEveryoneAmount}
                          onChange={e => setPayEveryoneAmount(e.target.value)}
                        />
                      </div>
                      <div className="text-sm text-gray-500">
                        Total: £{(parseInt(payEveryoneAmount) || 0) * (gameState.players.length - 1)} to {gameState.players.length - 1} players
                      </div>
                      <Button
                        onClick={() => payEveryonePlayerId && payEveryoneAmount && payEveryone(payEveryonePlayerId, parseInt(payEveryoneAmount))}
                        disabled={!payEveryoneAmount}
                        className="w-full"
                      >
                        Pay Everyone £{payEveryoneAmount || 0}
                      </Button>
                    </div>
                  </DialogContent>
                        </Dialog>

                <Dialog open={receiveAllDialogOpen} onOpenChange={setReceiveAllDialogOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Receive from Everyone
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {predefinedAmounts.map(amount => (
                          <Button
                            key={amount}
                            variant="outline"
                            onClick={() => receiveAllPlayerId && receiveFromAll(receiveAllPlayerId, amount)}
                          >
                            £{amount}
                          </Button>
                        ))}
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Or enter custom amount per player:</label>
                        <Input
                          type="number"
                          placeholder="£"
                          value={receiveAllAmount}
                          onChange={e => setReceiveAllAmount(e.target.value)}
                        />
                      </div>
                      <div className="text-sm text-gray-500">
                        Total: £{(parseInt(receiveAllAmount) || 0) * (gameState.players.length - 1)} from {gameState.players.length - 1} players
                      </div>
                      <Button
                        onClick={() => receiveAllPlayerId && receiveAllAmount && receiveFromAll(receiveAllPlayerId, parseInt(receiveAllAmount))}
                        disabled={!receiveAllAmount}
                        className="w-full"
                      >
                        Receive £{receiveAllAmount || 0} from Everyone
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={actionsDialogOpen} onOpenChange={setActionsDialogOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Player Actions</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm text-gray-600 mb-2 block">Transfer to player:</label>
                        <Select value={actionsTargetPlayer} onValueChange={setActionsTargetPlayer}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select target player" />
                          </SelectTrigger>
                          <SelectContent>
                            {gameState.players
                              .filter(p => p.id !== actionsPlayerId)
                              .map(p => (
                                <SelectItem key={p.id} value={p.id.toString()}>
                                  {p.name} (£{p.cash})
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          disabled={!actionsTargetPlayer}
                          onClick={() => actionsPlayerId && actionsTargetPlayer && transferAllCash(actionsPlayerId, parseInt(actionsTargetPlayer))}
                        >
                          Transfer All Cash
                        </Button>
                        <Button
                          variant="outline"
                          disabled={!actionsTargetPlayer}
                          onClick={() => actionsPlayerId && actionsTargetPlayer && transferAllProperties(actionsPlayerId, parseInt(actionsTargetPlayer))}
                        >
                          Transfer All Properties
                        </Button>
                      </div>
                      <div className="border-t pt-4">
                        <label className="text-sm text-gray-600 mb-2 block">Sell to Bank:</label>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            variant="outline"
                            className="bg-orange-50 hover:bg-orange-100"
                            onClick={() => actionsPlayerId && sellAllBuildings(actionsPlayerId)}
                          >
                            Sell All Buildings
                          </Button>
                          <Button
                            variant="outline"
                            className="bg-orange-50 hover:bg-orange-100"
                            onClick={() => actionsPlayerId && sellAllProperties(actionsPlayerId)}
                          >
                            Sell All Properties
                          </Button>
                        </div>
                      </div>
                      <div className="border-t pt-4">
                        <Button
                          variant="destructive"
                          className="w-full"
                          onClick={() => actionsPlayerId && cashOut(actionsPlayerId)}
                        >
                          Cash Out (Sell Everything)
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Configure Predefined Amounts</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="text-sm text-gray-600">
                        These amounts will appear as quick buttons in Fine/Tax, From Bank, Pay All, and Receive All dialogs.
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {predefinedAmounts.map(amount => (
                          <Badge
                            key={amount}
                            variant="secondary"
                            className="cursor-pointer hover:bg-red-100"
                            onClick={() => removePredefinedAmount(amount)}
                          >
                            £{amount} ×
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="New amount"
                          value={newAmount}
                          onChange={e => setNewAmount(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && addPredefinedAmount()}
                        />
                        <Button onClick={addPredefinedAmount}>Add</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                  {gameState.players.map(player => {
                    const { properties: regularProps, stations, utilities } = separatePropertiesByType(player.properties)
                    const ownedColorGroups = getOwnedColorGroups(player.properties)
            
            const renderPropertyTile = (prop: Property) => {
              const ownsColorGroup = prop.type === 'property' && ownedColorGroups.includes(prop.color)
              const rentDisplay = getRentDisplay(prop, player.properties)
              return (
                <div
                  key={prop.property_id}
                  className={`p-2 rounded text-sm ${COLOR_MAP[prop.color]} ${COLOR_TEXT[prop.color]} ${prop.is_mortgaged ? 'opacity-50' : ''} ${ownsColorGroup ? 'ring-2 ring-yellow-400' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {getPropertyIcon(prop.type)}
                      <span className="font-medium truncate">{prop.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs opacity-75">£{prop.purchase_cost}</span>
                      {getBuildingDisplay(prop)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs font-semibold bg-white/20 px-1 rounded">Rent: {rentDisplay}</span>
                  </div>
                  {prop.is_mortgaged && (
                    <Badge variant="secondary" className="mt-1 text-xs">Mortgaged</Badge>
                  )}
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {!prop.is_mortgaged && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-6 text-xs px-2 bg-yellow-200 hover:bg-yellow-300 text-yellow-800"
                        onClick={() => openPayRentDialog(prop.property_id, player.id)}
                      >
                        Rent
                      </Button>
                    )}
                    {prop.type === 'property' && !prop.is_mortgaged && (
                      <>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-6 text-xs px-2"
                          onClick={() => buildHouse(player.id, prop.property_id)}
                        >
                          +Build
                        </Button>
                        {(prop.houses || 0) > 0 || prop.has_hotel ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-6 text-xs px-2"
                            onClick={() => sellBuilding(player.id, prop.property_id)}
                          >
                            -Sell
                          </Button>
                        ) : null}
                      </>
                    )}
                    {prop.is_mortgaged ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-6 text-xs px-2"
                        onClick={() => unmortgageProperty(player.id, prop.property_id)}
                      >
                        Unmortgage
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-6 text-xs px-2"
                        onClick={() => mortgageProperty(player.id, prop.property_id)}
                      >
                        Mortgage
                      </Button>
                    )}
                    {(prop.houses || 0) === 0 && !prop.has_hotel && (
                      <>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-6 text-xs px-2 bg-red-200 hover:bg-red-300"
                          onClick={() => sellProperty(player.id, prop.property_id)}
                        >
                          Sell
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                                                        <Button
                                                          size="sm"
                                                          variant="secondary"
                                                          className="h-6 text-xs px-1 bg-blue-200 hover:bg-blue-300"
                                                          onClick={() => {
                                                            setTransferPropertyTo('')
                                                            setTransferPropertyPrice('')
                                                          }}
                                                        >
                                                          <ArrowRightLeft className="h-3 w-3" />T
                                                        </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Transfer {prop.name}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm text-gray-600">Transfer to:</label>
                                <Select value={transferPropertyTo} onValueChange={setTransferPropertyTo}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select player" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {gameState.players
                                      .filter(p => p.id !== player.id)
                                      .map(p => (
                                        <SelectItem key={p.id} value={p.id.toString()}>
                                          {p.name} (£{p.cash})
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <label className="text-sm text-gray-600">Sale price (optional):</label>
                                <Input
                                  type="number"
                                  placeholder="£0 for free transfer"
                                  value={transferPropertyPrice}
                                  onChange={e => setTransferPropertyPrice(e.target.value)}
                                />
                              </div>
                              <Button
                                className="w-full"
                                disabled={!transferPropertyTo}
                                onClick={() => {
                                  const price = transferPropertyPrice ? parseInt(transferPropertyPrice) : undefined
                                  transferProperty(player.id, parseInt(transferPropertyTo), prop.property_id, price)
                                }}
                              >
                                Transfer Property
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </>
                    )}
                  </div>
                </div>
              )
            }
            
            return (
              <Card key={player.id} className="bg-white">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-xl">{player.name}</CardTitle>
                      {ownedColorGroups.length > 0 && (
                        <div className="flex gap-1">
                          {ownedColorGroups.map(color => (
                            <div
                              key={color}
                              className={`w-4 h-4 rounded-full ${COLOR_MAP[color]} border-2 border-white shadow`}
                              title={`Owns all ${color} properties`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => removePlayer(player.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-3xl font-bold text-green-600">£{player.cash}</div>
                    <div className="flex gap-2 flex-wrap">
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="bg-green-100 hover:bg-green-200 text-green-800"
                                            onClick={() => passGo(player.id)}
                                          >
                                            GO +£200
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="bg-orange-100 hover:bg-orange-200 text-orange-800"
                                            onClick={() => openPayFineDialog(player.id)}
                                          >
                                            Fine/Tax
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="bg-purple-100 hover:bg-purple-200 text-purple-800"
                                            onClick={() => openPayFromBankDialog(player.id)}
                                          >
                                            From Bank
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="bg-pink-100 hover:bg-pink-200 text-pink-800"
                                            onClick={() => openPayEveryoneDialog(player.id)}
                                          >
                                            Pay All
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="bg-teal-100 hover:bg-teal-200 text-teal-800"
                                            onClick={() => openReceiveAllDialog(player.id)}
                                          >
                                            Receive All
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="bg-gray-100 hover:bg-gray-200 text-gray-800"
                                            onClick={() => openActionsDialog(player.id)}
                                          >
                                            <MoreHorizontal className="h-4 w-4" />
                                          </Button>
                                        </div>
                  </div>

                  <div className="space-y-3">
                    {regularProps.length > 0 && (
                      <div>
                        <div className="text-sm font-medium text-gray-600 mb-1">Properties ({regularProps.length})</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {regularProps.map(renderPropertyTile)}
                        </div>
                      </div>
                    )}
                    {stations.length > 0 && (
                      <div>
                        <div className="text-sm font-medium text-gray-600 mb-1">Stations ({stations.length})</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {stations.map(renderPropertyTile)}
                        </div>
                      </div>
                    )}
                    {utilities.length > 0 && (
                      <div>
                        <div className="text-sm font-medium text-gray-600 mb-1">Utilities ({utilities.length})</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {utilities.map(renderPropertyTile)}
                        </div>
                      </div>
                    )}
                    {player.properties.length === 0 && (
                      <div className="text-sm text-gray-400">No properties owned</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Available Properties & Rent Calculator</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="buy">
              <TabsList>
                <TabsTrigger value="buy">Buy Property</TabsTrigger>
                <TabsTrigger value="rent">Pay Rent</TabsTrigger>
              </TabsList>

              <TabsContent value="buy" className="mt-4">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                  {gameState.available_properties.map(prop => (
                    <Dialog key={prop.property_id}>
                      <DialogTrigger asChild>
                        <div
                          className={`p-2 rounded cursor-pointer hover:opacity-80 transition-opacity ${COLOR_MAP[prop.color]} ${COLOR_TEXT[prop.color]}`}
                        >
                          <div className="flex items-center gap-1 mb-1">
                            {getPropertyIcon(prop.type)}
                            <span className="text-xs font-medium truncate">{prop.name}</span>
                          </div>
                          <div className="text-sm font-bold">£{prop.purchase_cost}</div>
                        </div>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded ${COLOR_MAP[prop.color]}`} />
                            {prop.name}
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>Purchase Cost:</div>
                            <div className="font-bold">£{prop.purchase_cost}</div>
                            <div>Mortgage Value:</div>
                            <div className="font-bold">£{prop.mortgage_value}</div>
                            {prop.house_cost && (
                              <>
                                <div>House Cost:</div>
                                <div className="font-bold">£{prop.house_cost}</div>
                              </>
                            )}
                          </div>
                          {prop.rent && (
                            <div>
                              <div className="text-sm font-medium mb-2">Rent:</div>
                              <div className="grid grid-cols-3 gap-1 text-xs">
                                <div>Base: £{prop.rent['0']}</div>
                                <div>1 House: £{prop.rent['1']}</div>
                                <div>2 Houses: £{prop.rent['2']}</div>
                                <div>3 Houses: £{prop.rent['3']}</div>
                                <div>4 Houses: £{prop.rent['4']}</div>
                                <div>Hotel: £{prop.rent['hotel']}</div>
                              </div>
                            </div>
                          )}
                          <div className="space-y-2">
                            <div className="text-sm font-medium">Buy for:</div>
                            {gameState.players.map(player => (
                              <Button
                                key={player.id}
                                onClick={() => buyProperty(player.id, prop.property_id)}
                                className="w-full"
                                variant="outline"
                                disabled={player.cash < prop.purchase_cost}
                              >
                                {player.name} (£{player.cash})
                              </Button>
                            ))}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="rent" className="mt-4">
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-48">
                      <label className="text-sm text-gray-600">Player Landing on Property</label>
                      <Select value={selectedPlayer?.toString() || ''} onValueChange={v => setSelectedPlayer(parseInt(v))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select player" />
                        </SelectTrigger>
                        <SelectContent>
                          {gameState.players.map(p => (
                            <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-24">
                      <label className="text-sm text-gray-600">Dice Roll</label>
                      <Input
                        type="number"
                        placeholder="2-12"
                        min={2}
                        max={12}
                        value={diceRoll}
                        onChange={e => setDiceRoll(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="text-sm text-gray-600">
                    Select an owned property to pay rent:
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                    {gameState.players.flatMap(player =>
                      player.properties.map(prop => (
                        <div
                          key={prop.property_id}
                          className={`p-2 rounded cursor-pointer hover:opacity-80 transition-opacity ${COLOR_MAP[prop.color]} ${COLOR_TEXT[prop.color]} ${prop.is_mortgaged ? 'opacity-50' : ''}`}
                          onClick={() => {
                            if (selectedPlayer && !prop.is_mortgaged && selectedPlayer !== player.id) {
                              const dice = prop.type === 'utility' ? parseInt(diceRoll) : undefined
                              if (prop.type === 'utility' && !dice) {
                                setError('Dice roll required for utility rent')
                                return
                              }
                              payRent(selectedPlayer, prop.property_id, dice)
                            }
                          }}
                        >
                          <div className="flex items-center gap-1 mb-1">
                            {getPropertyIcon(prop.type)}
                            <span className="text-xs font-medium truncate">{prop.name}</span>
                          </div>
                          <div className="text-xs">Owner: {player.name}</div>
                          {getBuildingDisplay(prop)}
                          {prop.is_mortgaged && <Badge variant="secondary" className="text-xs">Mortgaged</Badge>}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {transactions.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Transaction History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Time</th>
                      <th className="text-left p-2">Type</th>
                      <th className="text-left p-2">From</th>
                      <th className="text-left p-2">To</th>
                      <th className="text-right p-2">Amount</th>
                      <th className="text-left p-2">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...transactions].reverse().map(t => (
                      <tr key={t.id} className="border-b hover:bg-gray-50">
                        <td className="p-2 text-gray-500">
                          {new Date(t.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="p-2">
                          <Badge variant="outline" className="text-xs">
                            {t.type}
                          </Badge>
                        </td>
                        <td className="p-2">{t.from_entity}</td>
                        <td className="p-2">{t.to_entity}</td>
                        <td className="p-2 text-right font-medium text-green-600">£{t.amount}</td>
                        <td className="p-2 text-gray-600">{t.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default App
