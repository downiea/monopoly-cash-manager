import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Users, Building2, Train, Zap, ParkingCircle, Banknote, Home, Hotel, RefreshCw, ArrowRightLeft } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

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

interface GameState {
  players: Player[]
  free_parking_pot: number
  available_properties: Property[]
  version: string
  versions: string[]
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

  const fetchGameState = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/game/state`)
      const data = await response.json()
      setGameState(data)
      setError(null)
    } catch (err) {
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
  }

  const payRent = async (fromPlayerId: number, propertyId: string, dice?: number) => {
    await handleApiCall('/rent/pay', 'POST', {
      from_player_id: fromPlayerId,
      property_id: propertyId,
      dice_roll: dice,
    })
  }

  const collectFreeParking = async (playerId: number) => {
    await handleApiCall('/free-parking/collect', 'POST', { player_id: playerId })
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
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Banknote className="h-8 w-8" />
            Monopoly Cash Manager
          </h1>
          <div className="flex items-center gap-4">
            <Button onClick={fetchGameState} variant="outline" size="sm" disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={resetGame} variant="destructive" size="sm">
              Reset Game
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
          <Card className="bg-yellow-100 border-yellow-400">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-yellow-800">
                <ParkingCircle className="h-5 w-5" />
                Free Parking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-800">£{gameState.free_parking_pot}</div>
              {gameState.players.length > 0 && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="mt-2">
                      Collect
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Collect Free Parking</DialogTitle>
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
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Banknote className="h-5 w-5" />
                Money Transfer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 items-end">
                <div className="flex-1 min-w-24">
                  <label className="text-xs text-gray-500">From</label>
                  <Select value={transferFrom} onValueChange={setTransferFrom}>
                    <SelectTrigger>
                      <SelectValue placeholder="From" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank">Bank</SelectItem>
                      {gameState.players.map(p => (
                        <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 min-w-24">
                  <label className="text-xs text-gray-500">To</label>
                  <Select value={transferTo} onValueChange={setTransferTo}>
                    <SelectTrigger>
                      <SelectValue placeholder="To" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank">Bank</SelectItem>
                      <SelectItem value="fine">Fine (Free Parking)</SelectItem>
                      {gameState.players.map(p => (
                        <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-24">
                  <label className="text-xs text-gray-500">Amount</label>
                  <Input
                    type="number"
                    placeholder="£"
                    value={transferAmount}
                    onChange={e => setTransferAmount(e.target.value)}
                  />
                </div>
                <Button onClick={transferMoney} disabled={!transferFrom || !transferTo || !transferAmount}>
                  Transfer
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Game Version
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={gameState.version}
                onValueChange={setGameVersion}
                disabled={gameState.players.length > 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select version" />
                </SelectTrigger>
                <SelectContent>
                  {gameState.versions.map(v => (
                    <SelectItem key={v} value={v}>
                      {v.charAt(0).toUpperCase() + v.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {gameState.players.length > 0 && (
                <div className="text-xs text-gray-500 mt-1">
                  Reset game to change version
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Add Player
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="Player name"
                  value={newPlayerName}
                  onChange={e => setNewPlayerName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addPlayer()}
                />
                <Button onClick={addPlayer} disabled={gameState.players.length >= 8}>
                  Add
                </Button>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {gameState.players.length}/8 players
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          {gameState.players.map(player => (
            <Card key={player.id} className="bg-white">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{player.name}</CardTitle>
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
                <div className="text-2xl font-bold text-green-600 mb-3">£{player.cash}</div>

                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-600">Properties ({player.properties.length})</div>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {player.properties.map(prop => (
                      <div
                        key={prop.property_id}
                        className={`p-2 rounded text-sm ${COLOR_MAP[prop.color]} ${COLOR_TEXT[prop.color]} ${prop.is_mortgaged ? 'opacity-50' : ''}`}
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
                        {prop.is_mortgaged && (
                          <Badge variant="secondary" className="mt-1 text-xs">Mortgaged</Badge>
                        )}
                        <div className="flex gap-1 mt-1 flex-wrap">
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
                                    className="h-6 text-xs px-2 bg-blue-200 hover:bg-blue-300"
                                    onClick={() => {
                                      setTransferPropertyTo('')
                                      setTransferPropertyPrice('')
                                    }}
                                  >
                                    <ArrowRightLeft className="h-3 w-3 mr-1" />
                                    Transfer
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
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
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
      </div>
    </div>
  )
}

export default App
