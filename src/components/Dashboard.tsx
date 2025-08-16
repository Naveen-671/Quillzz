"use client";
import { trpc } from "@/app/_trpc/client";
import UploadButton from "./UploadButton";
import { Ghost, Loader2, MessageSquare, Plus, Trash } from "lucide-react";
import Skeleton from "react-loading-skeleton";
import Link from "next/link";
import { format } from "date-fns";
import { Button } from "./ui/button";
import { useState } from "react";
const Dashboard = () => {
  // to add loading state to deleting file by default the state is null
  const [currentlyDeletingFile, setCurrentlyDeletingFile] = useState<
    string | null
  >(null);
  //forcing to refresh the page automatically once the file is been deleted
  const utils = trpc.useUtils(); // convert to useContext() isted
  const { data: files, isLoading } = trpc.getUserFiles.useQuery();
  const { mutate: deleteFile } = trpc.deleteFile.useMutation({
    onSuccess: () => {
      utils.getUserFiles.invalidate();
    },
    //on making changes --- on deleting the file
    onMutate({ id }) {
      setCurrentlyDeletingFile(id); // to add loading to only the deleting file by taking its id from current state
    },
    onSettled() {
      setCurrentlyDeletingFile(null); // after deleting to come back to normal state  --- to stop loading state
    },
  });
  // max-w-7xl
  return (
    <main className="mx-auto  max-w-8xl md:p-10">
      <div className="mt-8 flex flex-col items-start justify-between gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-center sm:gap-0">
        <h1 className="mb-3 font-bold text-5xl text-gray-900">My Files</h1>
        <UploadButton isSubscribed={false} />
      </div>

      {/* gradient design for the background only style */}
      
      <div
  aria-hidden="true"
  className="pointer-events-none fixed inset-0 -z-10 overflow-hidden transform-gpu"
>
  <div
    style={{
      clipPath: "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
      backgroundImage: `linear-gradient(
        135deg,
        #a0c4ff,       /* Soft Sky Blue */
        #bdb2ff 25%,   /* Light Lavender */
        #ffc6ff 50%,   /* Soft Pink */
        #caffbf 75%,   /* Pale Mint Green */
        #9bf6ff 100%   /* Light Aqua Blue */
      )`,
      opacity: 0.4,
      filter: "blur(150px)",
    }}
    className="absolute inset-0 mx-auto w-[160vw] max-w-none translate-x-[-30%] rotate-[25deg]"
  />
</div>


      {/* display all user files */}
      {files && files?.length !== 0 ? (
        <ul className="mt-8 grid grid-cols-1 gap-6 divide-y divide-zinc-200 md:grid-cols-2 lg:grid-cols-3">
          {files
            .sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            )
            .map((file) => (
              <li
                key={file.id}
                className="col-span-1 divide-y divide-gray-200 rounded-lg bg-white shadow transition hover:shadow-lg"
              >
                <Link
                  href={`/dashboard/${file.id}`}
                  className="flex flex-col gap-2"
                >
                  <div className="pt-6 px-6 flex w-full items-center justify-between space-x-6">
                    <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500" />
                    <div className="flex-1 truncate">
                      <div className="flex items-center space-x-3">
                        <h3 className="truncate text-lg font-medium text-zinc-900">
                          {file.name}
                        </h3>
                      </div>
                    </div>
                  </div>
                </Link>

                <div className="px-6 mt-4 grid grid-cols-3 place-items-center py-2 gap-6 text-xs text-zinc-500">
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    {format(new Date(file.createdAt), "MMM yyyy")}
                  </div>

                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    mocked
                  </div>

                  <Button
                    onClick={() => deleteFile({ id: file.id })}
                    size="sm"
                    className="w-full"
                    variant="destructive"
                  >
                    {currentlyDeletingFile === file.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </li>
            ))}
        </ul>
      ) : isLoading ? (
        <Skeleton className="my-2" height={100} count={3} />
      ) : (
        <div className="mt-16 flex flex-col items-center gap-2">
          <Ghost className="h-8 w-8 text-zinc-900" />
          <h3 className="font-semibold text-xl">Pretty empty around here</h3>
          <p>Let&apos;s upload your first PDF.</p>
        </div>
      )}
    </main>
  );
};

export default Dashboard;
