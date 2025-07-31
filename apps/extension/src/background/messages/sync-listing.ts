import type { PlasmoMessaging } from "@plasmohq/messaging"
import { api } from "~utils/api"

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  const { listingId } = req.body

  try {
    // Sync listing with our backend
    const response = await api.syncListing(listingId)
    
    if (response.error) {
      res.send({ error: response.error })
      return
    }

    // Show notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: '/icon128.png',
      title: 'Listing Synced',
      message: `Successfully synced listing ${listingId}`,
    })

    res.send({ success: true, data: response.data })
  } catch (error) {
    res.send({ error: error.message })
  }
}

export default handler