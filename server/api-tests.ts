import { WebClient } from '@slack/web-api';
import { AxiosResponse } from 'axios';
import axios from 'axios';
import dotenv from 'dotenv';
import jsonwebtoken from 'jsonwebtoken';

dotenv.config();

// Function to test all API connections
async function testApiConnections() {
  console.log("==== TESTING API CONNECTIONS ====");
  
  // Test SLACK API
  await testSlackApi();
  
  // Test GOOGLE API
  await testGoogleApi();
  
  // Test ZOOM API
  await testZoomApi();
  
  console.log("==== API TESTS COMPLETE ====");
}

// Test Slack API connection
async function testSlackApi() {
  console.log("\n--- Testing Slack API Connection ---");
  try {
    if (!process.env.SLACK_API_TOKEN) {
      throw new Error("SLACK_API_TOKEN is not set");
    }
    
    const slack = new WebClient(process.env.SLACK_API_TOKEN);
    const response = await slack.auth.test();
    
    if (response.ok) {
      console.log("✅ SLACK API connection successful");
      console.log(`   Team: ${response.team}`);
      console.log(`   User: ${response.user}`);
    } else {
      console.log("❌ SLACK API connection failed");
      console.log(response);
    }
  } catch (error: any) {
    console.log("❌ SLACK API connection failed");
    console.error(error.message || 'Unknown error');
  }
}

// Test Google API connection
async function testGoogleApi() {
  console.log("\n--- Testing Google API Connection ---");
  try {
    if (!process.env.GOOGLE_API_KEY) {
      throw new Error("GOOGLE_API_KEY is not set");
    }
    
    // Test with the Google Books API (a simple API that requires just the API key)
    const response = await axios.get(
      `https://www.googleapis.com/books/v1/volumes?q=hr+management&key=${process.env.GOOGLE_API_KEY}`
    );
    
    if (response.status === 200) {
      console.log("✅ GOOGLE API connection successful");
      console.log(`   Total items found: ${response.data.totalItems}`);
    } else {
      console.log("❌ GOOGLE API connection failed");
      console.log(response.status, response.statusText);
    }
  } catch (error: any) {
    console.log("❌ GOOGLE API connection failed");
    if (error.response) {
      console.error(`Error: ${error.response.status} - ${error.response.data.error?.message || 'Unknown error'}`);
    } else {
      console.error(error.message || 'Unknown error');
    }
  }
}

// Test Zoom API connection
async function testZoomApi() {
  console.log("\n--- Testing Zoom API Connection ---");
  try {
    if (!process.env.ZOOM_API_KEY || !process.env.ZOOM_API_SECRET) {
      throw new Error("ZOOM_API_KEY or ZOOM_API_SECRET is not set");
    }
    
    const payload = {
      iss: process.env.ZOOM_API_KEY,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 // 1 hour expiration
    };
    
    const token = jsonwebtoken.sign(payload, process.env.ZOOM_API_SECRET);
    
    // Test with Zoom Users List API
    const response = await axios.get('https://api.zoom.us/v2/users', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 200) {
      console.log("✅ ZOOM API connection successful");
      console.log(`   Total users: ${response.data.total_records}`);
    } else {
      console.log("❌ ZOOM API connection failed");
      console.log(response.status, response.statusText);
    }
  } catch (error: any) {
    console.log("❌ ZOOM API connection failed");
    if (error.response) {
      console.error(`Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    } else {
      console.error(error.message || 'Unknown error');
    }
  }
}

// Run all tests
testApiConnections();