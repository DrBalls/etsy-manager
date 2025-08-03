import { requireAuth } from '@/lib/auth/utils';
import { ListingRepository } from '@/lib/repositories';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Edit, ExternalLink, Package, DollarSign, Eye, Heart } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

interface ListingPageProps {
  params: {
    listingId: string;
  };
}

export default async function ListingDetailPage({ params }: ListingPageProps) {
  const session = await requireAuth();
  const listing = await ListingRepository.findWithMedia(params.listingId);

  if (!listing || listing.userId !== session.user.id) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/listings">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Listings
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">{listing.title}</h1>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" asChild>
            <a href={listing.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              View on Etsy
            </a>
          </Button>
          <Button size="sm">
            <Edit className="mr-2 h-4 w-4" />
            Edit Listing
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Price</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${listing.price.toString()} {listing.currencyCode}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{listing.quantity}</div>
            {listing.quantity <= 5 && listing.quantity > 0 && (
              <p className="text-xs text-red-600">Low stock</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{listing.views.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Favorites</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{listing.favoritersCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="shipping">Shipping</TabsTrigger>
          <TabsTrigger value="seo">SEO & Tags</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Listing Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge variant="secondary" className="mt-1">
                    {listing.state}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Created</p>
                  <p className="mt-1">{format(new Date(listing.etsyCreatedAt || listing.createdAt), 'PPP')}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                  <p className="mt-1">{format(new Date(listing.etsyUpdatedAt || listing.updatedAt), 'PPP')}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">SKU</p>
                  <p className="mt-1">{listing.skuNumber || 'Not set'}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Description</p>
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap">{listing.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="images" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Product Images</CardTitle>
              <CardDescription>Manage your product photos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
                {listing.images?.map((image, index) => (
                  <div key={image.id} className="relative group">
                    <img
                      src={image.url}
                      alt={`Product image ${index + 1}`}
                      className="rounded-lg object-cover w-full aspect-square"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <Button variant="secondary" size="sm">
                        View
                      </Button>
                    </div>
                  </div>
                ))}
                {(!listing.images || listing.images.length === 0) && (
                  <div className="col-span-full text-center py-8 text-muted-foreground">
                    No images uploaded
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Management</CardTitle>
              <CardDescription>Track stock levels and variations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Current Stock</p>
                    <p className="text-sm text-muted-foreground">Main inventory level</p>
                  </div>
                  <p className="text-2xl font-bold">{listing.quantity}</p>
                </div>
                {/* Inventory variations would be loaded separately if needed */}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shipping" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Shipping Settings</CardTitle>
              <CardDescription>Configure shipping options and costs</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Shipping configuration coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SEO & Tags</CardTitle>
              <CardDescription>Optimize your listing for search</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {listing.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Materials</p>
                <div className="flex flex-wrap gap-2">
                  {listing.materials.map((material, index) => (
                    <Badge key={index} variant="outline">
                      {material}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}