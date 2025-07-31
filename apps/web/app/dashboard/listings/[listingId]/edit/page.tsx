import { requireAuth } from '@/lib/auth/utils';
import { ListingRepository } from '@/lib/repositories';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

interface ListingEditPageProps {
  params: {
    listingId: string;
  };
}

export default async function ListingEditPage({ params }: ListingEditPageProps) {
  const user = await requireAuth();
  const listing = await ListingRepository.findById(params.listingId);

  if (!listing || listing.userId !== user.id) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href={`/dashboard/listings/${listing.id}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Listing
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Edit Listing</h1>
        </div>
        <Button>
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </div>

      {/* Edit Form */}
      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="pricing">Pricing & Inventory</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
          <TabsTrigger value="seo">SEO & Tags</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Update your listing title and description</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  type="text"
                  defaultValue={listing.title}
                  placeholder="Enter listing title"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  defaultValue={listing.description}
                  placeholder="Enter detailed description"
                  rows={10}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="state">Status</Label>
                  <Select defaultValue={listing.state}>
                    <SelectTrigger id="state">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="who-made">Who Made</Label>
                  <Select defaultValue={listing.whoMade || 'i_did'}>
                    <SelectTrigger id="who-made">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="i_did">I did</SelectItem>
                      <SelectItem value="collective">A member of my shop</SelectItem>
                      <SelectItem value="someone_else">Another company or person</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="when-made">When Made</Label>
                  <Select defaultValue={listing.whenMade || 'made_to_order'}>
                    <SelectTrigger id="when-made">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="made_to_order">Made to order</SelectItem>
                      <SelectItem value="2020_2024">2020-2024</SelectItem>
                      <SelectItem value="2010_2019">2010-2019</SelectItem>
                      <SelectItem value="2005_2009">2005-2009</SelectItem>
                      <SelectItem value="before_2005">Before 2005</SelectItem>
                      <SelectItem value="2000_2004">2000-2004</SelectItem>
                      <SelectItem value="1990s">1990s</SelectItem>
                      <SelectItem value="1980s">1980s</SelectItem>
                      <SelectItem value="1970s">1970s</SelectItem>
                      <SelectItem value="1960s">1960s</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="is-supply">Is Supply</Label>
                  <Select defaultValue={listing.isSupply ? 'true' : 'false'}>
                    <SelectTrigger id="is-supply">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="false">No</SelectItem>
                      <SelectItem value="true">Yes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pricing & Inventory</CardTitle>
              <CardDescription>Set your price and manage stock levels</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="price">Price</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      $
                    </span>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      defaultValue={listing.price}
                      className="pl-7"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    defaultValue={listing.quantity}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    type="text"
                    defaultValue={listing.sku || ''}
                    placeholder="Optional SKU"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="processing-min">Processing Time</Label>
                  <div className="flex gap-2">
                    <Input
                      id="processing-min"
                      type="number"
                      defaultValue={listing.processingMin || 1}
                      placeholder="Min"
                    />
                    <span className="flex items-center">to</span>
                    <Input
                      id="processing-max"
                      type="number"
                      defaultValue={listing.processingMax || 3}
                      placeholder="Max"
                    />
                    <span className="flex items-center">days</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="images" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Product Images</CardTitle>
              <CardDescription>Upload and manage your product photos</CardDescription>
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
                    <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                      <Button variant="secondary" size="sm">
                        Replace
                      </Button>
                      <Button variant="destructive" size="sm">
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="border-2 border-dashed rounded-lg aspect-square flex items-center justify-center cursor-pointer hover:bg-muted/50">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Add Image</p>
                  </div>
                </div>
              </div>
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
              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <Textarea
                  id="tags"
                  defaultValue={listing.tags.join(', ')}
                  placeholder="Enter tags separated by commas"
                  rows={3}
                />
                <p className="text-sm text-muted-foreground">
                  Add up to 13 tags to help buyers find your listing
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="materials">Materials</Label>
                <Textarea
                  id="materials"
                  defaultValue={listing.materials.join(', ')}
                  placeholder="Enter materials separated by commas"
                  rows={2}
                />
                <p className="text-sm text-muted-foreground">
                  List the materials used in your product
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}