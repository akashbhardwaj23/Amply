import { fetchChargerData } from "@/app/(home)/server/charger"
import { NextResponse } from "next/server"
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });


export async function POST(request: Request) {
  const { transcript, chargerData } = await request.json()

  console.log(chargerData)

  console.log(process.env.OPEN_API_KEY)

  const prompt = `
Extract the following details from the user command:
- location
- charger power in kW (number)
- max price in SOL (number)
- charger type (e.g., CCS, CHAdeMO, Type2)

User command: "${transcript}"

Here is the Array list of available chargers and filter these charger based on the user command:
${chargerData}

Return only a filtered Array from the charerData that is provided and nothing else in the Response.
`

  try {
    const completion = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents : prompt
    })

    const content = completion.text || ""
    
    // Try to parse JSON from the response
    // const parsed = JSON.parse(content)
    console.log(content)

    return NextResponse.json({ content })
  } catch (error) {
    console.error("OpenAI error:", error)
    return NextResponse.json({ error: "Failed to parse command" }, { status: 500 })
  }
}
