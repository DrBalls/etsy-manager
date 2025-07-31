import type { PlasmoMessaging } from "@plasmohq/messaging"
import { api } from "~utils/api"

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  const { listingIds, updates } = req.body

  try {
    // Send bulk update request to our API
    const response = await api.bulkUpdateListings(listingIds, updates)
    
    if (response.error) {
      res.send({ error: response.error })
      return
    }

    // Show notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: '/icon128.png',
      title: 'Bulk Update Complete',
      message: `Successfully updated ${listingIds.length} listings`,
    })

    res.send({ success: true, data: response.data })
  } catch (error) {
    res.send({ error: error.message })
  }
}

export default handler