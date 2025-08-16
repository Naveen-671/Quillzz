


// import ChatWrapper from '@/components/chat/ChatWrapper'
// import PdfRenderer from '@/components/PdfRenderer'
// import { db } from '@/db'
// // import { getUserSubscriptionPlan } from '@/lib/stripe'
// import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
// import { notFound, redirect } from 'next/navigation'

// interface PageProps {
//   params: {
//     fileid: string
//   }
// }

// const Page = async ({ params }: PageProps) => {
//   const { fileid } = await params //get the await out if require

//   const { getUser } = getKindeServerSession()
//   const user = await getUser()

//   if (!user || !user.id)
//     redirect(`/auth-callback?origin=dashboard/${fileid}`)

//   const file = await db.file.findFirst({
//     where: {
//       id: fileid,
//       userId: user.id,
//     },
//   })

//   if (!file) notFound()

// //   const plan = await getUserSubscriptionPlan()

//   return (
//     <div className='flex-1 justify-between flex flex-col h-[calc(100vh-3.5rem)]'>
//       <div className='mx-auto w-full max-w-8xl grow lg:flex xl:px-2'>
//         {/* Left sidebar & main wrapper */}
//         <div className='flex-1 xl:flex'>
//           <div className='px-4 py-6 sm:px-6 lg:pl-8 xl:flex-1 xl:pl-6'>
//             {/* Main area  once upon a time */}
//             {/* return (<div>{fileid} <br />  */}
//              {/* {file.url} <br /></div>) */}
//             {/* <br /> */}
//             {/* {user.id} */}
//             {/* <br /> */}
            
//             <PdfRenderer url={file.url} />
//             {/* <PdfRenderer url = {`https://utfs.io/f/lneZdKS3iNRpjRVicQtWewlFzpPK3DUYtAG48cZbs2NoX75v`}/> */}
//           </div>
//         </div>

//       {/* gradient design for the background only style */}
      
//       <div
//   aria-hidden="true"
//   className="pointer-events-none fixed inset-0 -z-10 overflow-hidden transform-gpu"
// >
//   <div
//     style={{
//       clipPath: "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
//       backgroundImage: `linear-gradient(
//         135deg,
//         #a0c4ff,       /* Soft Sky Blue */
//         #bdb2ff 25%,   /* Light Lavender */
//         #ffc6ff 50%,   /* Soft Pink */
//         #caffbf 75%,   /* Pale Mint Green */
//         #9bf6ff 100%   /* Light Aqua Blue */
//       )`,
//       opacity: 0.4,
//       filter: "blur(150px)",
//     }}
//     className="absolute inset-0 mx-auto w-[160vw] max-w-none translate-x-[-30%] rotate-[25deg]"
//   />
// </div>

//         <div className='shrink-0 flex-[0.75] border-t border-gray-200 lg:w-96 lg:border-l lg:border-t-0'>
//           <ChatWrapper fileId={file.id} isSubscribed={false}/>
//         </div>
//       </div>
//     </div>
//   )
// }

// export default Page




import ChatWrapper from '@/components/chat/ChatWrapper'
import PdfRenderer from '@/components/PdfRenderer'
import { db } from '@/db'
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { notFound, redirect } from 'next/navigation'

interface PageProps {
  params: {
    fileid: string
  }
}

const Page = async ({ params }: PageProps) => {
  const { fileid } = await params

  const { getUser } = getKindeServerSession()
  const user = await getUser()

  if (!user || !user.id)
    redirect(`/auth-callback?origin=dashboard/${fileid}`)

  const file = await db.file.findFirst({
    where: {
      id: fileid,
      userId: user.id,
    },
  })

  if (!file) notFound()

  return (
    <div className='flex-1 justify-between overflow-x-hidden flex flex-col h-[calc(100vh-3.5rem)]'>
      <div className='mx-auto w-full max-w-full overflow-x-hidden grow lg:flex xl:px-2'>
        {/* Left sidebar & main wrapper */}
        <div className='flex-1 lg:pr-4 grow overflow-x-hidden xl:flex'>
          <div className='px-4 py-6 sm:px-6 lg:pl-34  xl:flex-1 xl:pl-12'>
            <PdfRenderer url={file.url} />
          </div>
        </div>

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

        {/* Chat wrapper, set to occupy full width */}
        <div className='flex-1 lg:pr-24 lg:pl-22 overflow-hidden w-[calc(100vh-10.5rem)]'>
          <ChatWrapper fileId={file.id} isSubscribed={false} />
        </div>
      </div>
    </div>
  )
}

export default Page




// import ChatWrapper from '@/components/chat/ChatWrapper'
// import PdfRenderer from '@/components/PdfRenderer'
// import { db } from '@/db'
// // import { getUserSubscriptionPlan } from '@/lib/stripe'
// import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
// import { notFound, redirect } from 'next/navigation'

// interface PageProps {
//   params: {
//     fileid: string
//   }
// }

// const Page = async ({ params }: PageProps) => {
//   const { fileid } = params

//   const { getUser } = getKindeServerSession()
//   const user = await getUser()

//   if (!user || !user.id)
//     redirect(`/auth-callback?origin=dashboard/${fileid}`)

//   const file = await db.file.findFirst({
//     where: {
//       id: fileid,
//       userId: user.id,
//     },
//   })

//   if (!file) notFound()

//   // const plan = await getUserSubscriptionPlan()

//   return (
//     <div className='flex-1 justify-between flex flex-col h-[calc(100vh-3.5rem)]'>
//       <div className='mx-auto w-full max-w-8xl grow lg:flex xl:px-2'>
//         {/* Left sidebar & main wrapper */}
//         <div className='flex-1 xl:flex'>
//           <div className='px-4 py-6 sm:px-6 lg:pl-8 xl:flex-1 xl:pl-6'>
//             {/* Main area */}
//             <PdfRenderer url={file.url} />
//           </div>
//         </div>

//         <div className='shrink-0 flex-[0.75] border-t border-gray-200 lg:w-96 lg:border-l lg:border-t-0'>
//           <ChatWrapper 
//             fileId={file.id} isSubscribed={false} />
//         </div>
//       </div>
//     </div>
//   )
// }

// export default Page