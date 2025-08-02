
import "@plasmohq/messaging"

interface MmMetadata {
	"bulk-update" : {}
	"quick-edit" : {}
	"sync-listing" : {}
}

interface MpMetadata {
	
}

declare module "@plasmohq/messaging" {
  interface MessagesMetadata extends MmMetadata {}
  interface PortsMetadata extends MpMetadata {}
}
