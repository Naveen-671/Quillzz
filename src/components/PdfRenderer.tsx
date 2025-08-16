

"use client";
import { ChevronDown, ChevronUp, Loader2, RotateCw, Search } from 'lucide-react';
import React from 'react';
import { useState, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import 'react-pdf/dist/Page/AnnotationLayer.css';
import SimpleBar from 'simplebar-react'
import 'react-pdf/dist/Page/TextLayer.css';
import { useResizeDetector } from 'react-resize-detector';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { toast } from '@/hooks/use-toast';
import {useForm} from 'react-hook-form'
import { z } from 'zod';
import {zodResolver} from '@hookform/resolvers/zod'
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem } from './ui/dropdown-menu';
import { DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu';
import PdfFullscreen from './PdfFullscreen';
// import { useResizeDetector } from '@maslianok/react-resize-detector';
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfRendererProps {
  url: string; // Original URL of the PDF
}



const PdfRenderer = ({ url }: PdfRendererProps) => {
  const [publicUrl, setPublicUrl] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [numPages, setNumPages] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currPage,setCurrPage] = useState<number>(1)
  const { width, ref } = useResizeDetector()
  const [scale, setScale] = useState<number>(1)
  const [renderedScale,setRenderedScale] = useState<number | null>(null)
  const [rotation,setRotation] = useState<number>(0)

  const isLoading = renderedScale !== scale

  const CustomPageValidator = z.object({
    page: z.string().refine((num) => Number(num) >0 && Number(num) <= numPages!)
  })

  type TCustomPageValidator = z.infer<typeof CustomPageValidator>

  //kick this block if needed
  
  const {
    register,
    handleSubmit,
    formState:{errors},
    setValue
  } = useForm<TCustomPageValidator>({
    defaultValues:{
      page: '1',
    },
    resolver: zodResolver(CustomPageValidator)
  })

  // Function to convert URL to public URL and filename
  const convertToPublicUrl = (fileUrl: string): { publicUrl: string; fileName: string } => {
    const fileName = fileUrl.split('/').pop() ?? "document.pdf";
    const publicUrl = `https://utfs.io/f/${fileName}`;
    // const publicUrl = encodeURIComponent(publicUrl1);
    return { publicUrl, fileName };
  };

  // UseEffect to handle URL transformation and component updates
  useEffect(() => {
    const { publicUrl, fileName } = convertToPublicUrl(url);
    setPublicUrl(publicUrl);
    setFileName(fileName);
  }, [url]);

  // Document load success handler
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setError(null);

  };

  // Document load error handler
  const onDocumentLoadError = (error: Error) => {
    console.error("Error loading PDF:", error);
    setError("Failed to load PDF. Please check the URL or try again later.");

  };

  const handlePageSubmit = ({page,}:
    TCustomPageValidator)=>{
      setCurrPage(Number(page))
      setValue("page",String(page))
    }
  

  return (
    <div className="w-full bg-white rounded-md shadow flex flex-col items-center">
      <div className="h-14 w-full border-b border-zinc-200 flex items-center justify-evenly">
        <div className="flex items-center gap-1.5">
          <Button 
          disabled={currPage <= 1}
          onClick={()=>{
            setCurrPage((prev) =>
            prev -1 >1 ? prev-1 : 1)
            setValue("page",String(currPage-1))
          }}
          aria-label='previous page'> 
            <ChevronDown className='h-4 w-4'/>
          </Button>
          
          <div className="flex items-center gap-1.5">
            <Input 
            {...register("page")}
            className= {cn('w-12 h-8',errors.page && 'focus-visible:ring-red-500')} 
            onKeyDown={(e)=>{
              if(e.key === 'Enter') {
                handleSubmit(handlePageSubmit)()
              }
            }}
            />
            <p className='text-zinc-700 text-sm space-x-1'>
              <span>/</span>
              <span>{numPages ?? 'x'}</span>
            </p>
          </div>

          <Button 
          disabled={numPages === undefined ||
            currPage === numPages
          }
          onClick={()=>{
            setCurrPage((prev) => prev + 1 > numPages! ? numPages! : prev+1)
            setValue("page",String(currPage+1))
          }}
          aria-label='next page'> 
            <ChevronUp className='h-4 w-4'/>
          </Button>
        </div>

        <div className="space-x-2">
          <DropdownMenu >
            <DropdownMenuTrigger asChild>
              <Button className = 'gap-1.5' aria-label='zoom' >
                <Search className='h-4 w-4'/>
                {scale*100}% <ChevronDown className='h-3 w-3 opacity-50'/>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
            <DropdownMenuItem onSelect={()=> setScale(0.5)}>
                50%
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={()=> setScale(1)}>
                100%
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={()=> setScale(1.5)}>
                150%
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={()=> setScale(2)}>
                200%
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={()=> setScale(2.5)}>
                250%
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={()=> setScale(3)}>
                300%
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button 
          onClick={() => setRotation((prev) => prev +90)}
          aria-label='rotate 90 degree'>
            <RotateCw className='h-4 w-4'/>
          </Button>

          <PdfFullscreen publicUrl={publicUrl}/>
        </div>
      </div>

      
      
      
      <div className="flex-1 w-full max-h-screen overflow-y-auto">
      <SimpleBar autoHide={false} className='max-h-[calc(100vh-10rem)]'>
      
      <div ref={ref}>
     
        {error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <Document
            file={publicUrl} // Dynamic public URL
            onLoadSuccess={({numPages})=>setNumPages(numPages)}
            onLoadError={() => {
              toast({
                title:'Error loading PDF',
                description:'please try again later',
                variant:'destructive',
              })
            }}
            className="max-h-screen"
          >
            {/* {Array.from(new Array(numPages), (el, index) => ( */}
              {isLoading && renderedScale ? <Page width={width ? width : 1}
              //  key={`page_${index + 1}`} 
              pageNumber={currPage} 
              scale={scale}
              key={"@"+renderedScale}
              rotate={rotation}
              /> : null}
            {/* ))} */}

            <Page 
            className={cn(isLoading ? 'hidden':"")}
            width={width ? width : 1}
              //  key={`page_${index + 1}`} 
              pageNumber={currPage} 
              scale={scale}
              rotate={rotation}
              key={"@"+scale}
              loading={
                <div className='flex justify-center'>
                  <Loader2 className='my-24 h-6 w-6 animate-spin'/>
                </div>
              }
              onRenderSuccess={()=> setRenderedScale(scale)}
              /> 
          </Document>
        )}
      
      
      </div>
    
      </SimpleBar>
      </div>
   
    </div>
  );
};

export default PdfRenderer;

