"use client"

import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { createClient } from "@/utils/supabase/client"

export function UserSelector({ value, onValueChange, disabled }) {
  const [users, setUsers] = React.useState([])
  const [loading, setLoading] = React.useState(true)
  const [searchText, setSearchText] = React.useState("")
  const [showSuggestions, setShowSuggestions] = React.useState(false)
  const [selectedUser, setSelectedUser] = React.useState(null)
  const inputRef = React.useRef(null)
  const suggestionsRef = React.useRef(null)

  React.useEffect(() => {
    fetchUsers()
  }, [])

  React.useEffect(() => {
    // Update display text when value changes externally
    if (value) {
      const user = users.find((u) => u.id === value)
      if (user) {
        setSelectedUser(user)
        setSearchText(user.full_name)
      }
    } else {
      setSelectedUser(null)
      setSearchText("")
    }
  }, [value, users])

  const fetchUsers = async () => {
    try {
      const supabase = createClient()

      // Fetch users from user table
      const { data, error } = await supabase
        .from("user")
        .select("id, full_name, email, user_type")
        .order("full_name", { ascending: true })

      if (error) {
        console.error("Error fetching users:", error)
        console.error("Error details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        setUsers([])
      } else {
        console.log("Successfully fetched users:", data)
        setUsers(data || [])
      }
    } catch (error) {
      console.error("Error fetching users:", error)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = React.useMemo(() => {
    if (!searchText.trim()) return users

    const query = searchText.toLowerCase()
    return users.filter(
      (user) =>
        user.full_name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
    )
  }, [users, searchText])

  const handleInputChange = (e) => {
    const newValue = e.target.value
    setSearchText(newValue)
    setShowSuggestions(true)

    // Clear selection if user modifies the text
    if (selectedUser && newValue !== selectedUser.full_name) {
      setSelectedUser(null)
      onValueChange("")
    }
  }

  const handleSelectUser = (user) => {
    setSelectedUser(user)
    setSearchText(user.full_name)
    onValueChange(user.id)
    setShowSuggestions(false)
  }

  const handleInputFocus = () => {
    setShowSuggestions(true)
  }

  const handleInputBlur = () => {
    // Delay to allow click on suggestion
    setTimeout(() => {
      if (!suggestionsRef.current?.contains(document.activeElement)) {
        setShowSuggestions(false)

        // Reset to selected user if no valid selection
        if (selectedUser) {
          setSearchText(selectedUser.full_name)
        } else {
          setSearchText("")
        }
      }
    }, 200)
  }

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        type="text"
        placeholder={loading ? "Loading users..." : "Search for a user..."}
        value={searchText}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        disabled={disabled || loading}
        className="w-full"
        autoComplete="off"
        maxLength={100}
      />

      {showSuggestions && !loading && filteredUsers.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-md max-h-60 overflow-auto"
        >
          {filteredUsers.map((user) => (
            <button
              key={user.id}
              type="button"
              className={cn(
                "w-full px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors flex items-start gap-2 border-b last:border-b-0",
                selectedUser?.id === user.id && "bg-accent"
              )}
              onClick={() => handleSelectUser(user)}
              onMouseDown={(e) => e.preventDefault()} // Prevent input blur
            >
              <Check
                className={cn(
                  "h-4 w-4 mt-0.5 shrink-0",
                  selectedUser?.id === user.id ? "opacity-100" : "opacity-0"
                )}
              />
              <div className="flex flex-col">
                <span className="font-medium text-sm">{user.full_name}</span>
                <span className="text-xs text-muted-foreground">
                  {user.email}
                  {user.user_type && ` • ${user.user_type}`}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {showSuggestions && !loading && searchText && filteredUsers.length === 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-md p-3"
        >
          <p className="text-sm text-muted-foreground text-center">
            No users found matching "{searchText}"
          </p>
        </div>
      )}
    </div>
  )
}
