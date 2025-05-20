    // src/app/[locale]/edit/[id]/page.tsx
    import { getServerSession } from "next-auth";
    import { authOptions } from "@/auth";
    import { redirect } from "next/navigation";
    import EditBillPageClient from '@/components/EditBillPageClient'; // Import the new client component

    interface EditPageProps {
      params: {
        id: string; // The bill ID from the URL
        locale: string;
      };
    }

    export default async function EditPage({ params }: EditPageProps) {
      const session = await getServerSession(authOptions);

      if (!session) {
        redirect(`/${params.locale}`); // Redirect unauthenticated users
      }

      const { id: billId } = params;

      return <EditBillPageClient billId={billId} />;
    }
    