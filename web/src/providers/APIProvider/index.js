import React, { createContext, useContext, useReducer } from 'react'
import * as API from './API'

const APIReducer = (state, { type, payload }) => {
    switch (type) {
        case 'start-request':
            return { ...state, error: undefined, loading: true }
        case 'user-created':
        case 'user-logged-in':
            return {
                ...state,
                authToken: payload.authToken,
                user: payload.user,
                loading: false
            }
        case 'user-logout':
            return { ...state, user: undefined, authToken: undefined }
        case 'error':
            return {
                ...state,
                error: payload.error,
                loading: false
            }
        default:
            throw new Error()
    }
}

const APIProviderContext = createContext({})

const APIProvider = props => {
    const [state, dispatch] = useReducer(APIReducer, {
        user: undefined,
        authToken: undefined,
        error: undefined,
        loading: false
    })

    const logout = () => dispatch({ type: 'user-logout' })

    const createUser = async (userData) => {
        dispatch({ type: 'start-request' })

        if (!state.user) {
            try {
                const user = await API.createUser(userData)
                const { token: authToken } = await API.signIn({ email: userData.email, password: userData.password })
                dispatch({ type: 'user-created', payload: { authToken, user } })
            } catch (error) {
                console.log(error)
                dispatch({ type: 'error', payload: { error: error.response.data } })
            }
        }
    }

    const createRestaurant = async ({ storeName, cnpj, phoneNumber, location }) =>
        API.createRestaurant({ storeName, cnpj, phoneNumber, location, userId: state.user.id, token: state.authToken })

    const getRestaurants = async () => API.getRestaurants()

    const getRestaurantById = async (restaurantId) =>
        API.getRestaurantById(restaurantId)

    const getFoodsCategoriesByRestaurant = async (restaurantId) =>
        API.getFoodsCategoriesByRestaurant(restaurantId)

    const getFoodsCategories = async () =>
        API.getFoodsCategories()

    const getFoodsByRestaurant = async (restaurantId) => {
        return API.getFoodByRestaurant(restaurantId)
    }

    const signIn = async ({ email, password }) => {
        dispatch({ type: 'start-request' })

        try {
            const { token: authToken, user_id: userId } = await API.signIn({ email, password })
            const user = await API.getUserById(userId, authToken)
            dispatch({ type: 'user-logged-in', payload: { user, authToken } })
        } catch (error) {
            dispatch({ type: 'error', payload: { error: error.response.data } })
        }
    }

    const createFood = async (food, restaurantId, authToken) =>
        API.createFood(food, restaurantId, authToken)

    return (
        <APIProviderContext.Provider value={{
            ...state,
            createUser,
            logout,
            getRestaurants,
            getFoodsByRestaurant,
            getRestaurantById,
            getFoodsCategories,
            createFood,
            getFoodsCategoriesByRestaurant,
            createRestaurant,
            signIn
        }} {...props} />
    )
}
APIProvider.Consumer = APIProviderContext.Consumer

export default APIProvider
export const useAPI = () => useContext(APIProviderContext)