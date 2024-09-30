import { Request , Response ,NextFunction} from "express";
type AsyncHandlerFunction = (req: Request, res: Response, next: NextFunction) => Promise<any>;

export const asyncHandler = (fn:AsyncHandlerFunction) => (req:Request, res:Response, next:NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
  