import { ChargerType } from "@/types";
import { Dispatch, SetStateAction } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Label } from "recharts";
import { PlugZap } from "lucide-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

export default function SelectChargeButton({
  charger,
  isCharging,
  handleSelectedCharger
}: {
  charger: ChargerType;
  isCharging: boolean;
  handleSelectedCharger: (charger : ChargerType) => void;
}) {
  return (
    <Card className="mb-2">
      <CardContent className="flex justify-between p-2">
        <div className="text-xs">
          <div className="mb-1">
            <label htmlFor="name">Charge Name :</label>
            {/* <Label>Charger Name :</Label> */}
            <h1>{charger.account.name}</h1>
          </div>
          <div className="flex justify-start gap-2">
            <label htmlFor="price">Price : </label>
            {/* <Label>Price : </Label> */}
            <h2>
              {(
                Number(charger.account.price.toString()) /
                LAMPORTS_PER_SOL
              ).toLocaleString(undefined, {
                maximumFractionDigits: 4,
              })}{" "}
            </h2>
          </div>
        </div>
        <Button
          onClick={() => handleSelectedCharger(charger)}
          variant="default"
          className="px-8"
          disabled={isCharging}
        >
          <PlugZap className="mr-2 h-4 w-4" />
          Select
        </Button>

        {/* {isCharging && (
             <div className="w-1/2 bg-gray-200 rounded-full h-2.5 mt-2">
               <div
                 className="bg-green-600 h-2.5 rounded-full"
                 style={{ width: `${progress}%` }}
               />
               <p className="text-sm text-gray-500 mt-1">
                 {progress.toFixed(0)}% complete
               </p>
             </div>
           )} */}
      </CardContent>
    </Card>
  );
}
