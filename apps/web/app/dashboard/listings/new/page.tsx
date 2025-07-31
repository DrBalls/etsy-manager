import { requireAuth } from '@/lib/auth/utils';
import { ShopRepository } from '@/lib/repositories';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function NewListingPage() {
  const user = await requireAuth();
  const shops = await ShopRepository.findByUserId(user.id);
  const primaryShop = shops[0];

  if (!primaryShop) {
    redirect('/dashboard/shops/connect');
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link href="/dashboard/listings">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Listings
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Create New Listing</h1>
      </div>

      {/* Form */}
      <form className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Enter the basic details for your listing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                type="text"
                placeholder="Enter a descriptive title"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe your product in detail"
                rows={10}
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="who-made">Who Made It? *</Label>
                <Select defaultValue="i_did">
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
                <Label htmlFor="when-made">When Was It Made? *</Label>
                <Select defaultValue="made_to_order">
                  <SelectTrigger id="when-made">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="made_to_order">Made to order</SelectItem>
                    <SelectItem value="2020_2024">2020-2024</SelectItem>
                    <SelectItem value="2010_2019">2010-2019</SelectItem>
                    <SelectItem value="2005_2009">2005-2009</SelectItem>
                    <SelectItem value="before_2005">Before 2005</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pricing & Inventory</CardTitle>
            <CardDescription>Set your price and manage stock</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="price">Price * ({primaryShop.currencyCode})</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    className="pl-7"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  placeholder="0"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sku">SKU (Optional)</Label>
                <Input
                  id="sku"
                  type="text"
                  placeholder="Stock keeping unit"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>SEO & Discovery</CardTitle>
            <CardDescription>Help buyers find your listing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tags">Tags *</Label>
              <Textarea
                id="tags"
                placeholder="Enter tags separated by commas (up to 13 tags)"
                rows={3}
                required
              />
              <p className="text-sm text-muted-foreground">
                Add relevant keywords to help buyers find your listing
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="materials">Materials (Optional)</Label>
              <Textarea
                id="materials"
                placeholder="Enter materials separated by commas"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline">
            Save as Draft
          </Button>
          <Button type="submit">
            Create Listing
          </Button>
        </div>
      </form>
    </div>
  );
}