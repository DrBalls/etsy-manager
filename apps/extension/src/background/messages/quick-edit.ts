import type { PlasmoMessaging } from "@plasmohq/messaging"
import { api } from "~utils/api"

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  const { listingId } = req.body

  try {
    // Fetch listing data from our API
    const response = await api.getListing(listingId)
    
    if (response.error) {
      res.send({ error: response.error })
      return
    }

    res.send({ data: response.data })
  } catch (error) {
    res.send({ error: error.message })
  }
}

export default handler