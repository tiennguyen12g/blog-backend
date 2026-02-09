import { ResponseData, ResponseDataOutput, ResponseDataWhenError } from "./GlobalResponseData";
import { HttpStatus, HttpMessage } from "./GlobalResponseEnum";

interface HandleRequestProps<T> {
     execute: () => Promise<T>;
     actionName: string;
   }

export async function handleRequest<T>({
     execute,
     actionName,
   }: HandleRequestProps<T>): Promise<ResponseDataOutput<T | ResponseDataWhenError>> {
     try {
       const result: any = await execute();
       
       // Check if result is already a response object (error response)
       // Error responses have specific structure: { errorMessage, errorAction } or status === "Failed"
       // Note: Article objects have a 'status' field ('draft'|'published'|'archived'), which is NOT a response status
       // So we check for error response structure, not just any status field
       const isErrorResponse = result && 
         typeof result === 'object' && 
         (
           result.status === "Failed" || 
           ('errorMessage' in result && 'errorAction' in result) ||
           (result.status && result.status === "Failed")
         );
       
       if(isErrorResponse){
        return {
          status: result.status || "Failed",
          result: result,
          statusCode: HttpStatus.ERROR,
          defaultMessage: HttpMessage.ERROR,
        }
       }
       
       // Normal success: wrap the data in a success response
       return ResponseData<T>({
         status:"Success",
         result: result,
         statusCode: HttpStatus.SUCCESS,
         defaultMessage: HttpMessage.SUCCESS,
       });
     } catch (error) {
       console.log(actionName, error);
       return ResponseData<ResponseDataWhenError>({
         status: "Failed",
         result: {
           data: null,
           errorMessage: error.message,
           errorAction: actionName,
         },
         statusCode: HttpStatus.ERROR,
         defaultMessage: HttpMessage.ERROR,
       });
     }
   }