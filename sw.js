import { sw_log, sw_error_log } from './loggers';
import { get, set } from './db';
import { MD5, enc } from 'crypto-js';
<<<<<<< HEAD
import { ourMD5 } from './md5';
import { parse } from 'graphql/language/parser'; // added by JR
import { visit } from 'graphql';



const getBody = async (e) => {
  // console.log('e.request in getBody =', e.request);
  const blob = await e.request.blob();
  const body = await blob.text();
  return body;
};
=======
import Metrics from './Metrics';
import { validSettings } from './index';

// Grab settings from IDB set during activation.
// Do this before registering our event listeners.
self.addEventListener('activate', async () => {
  try {
    const settings = await Promise.all(
      validSettings.map(async (setting) => {
        const result = await get('settings', setting);
        return { [setting]: result };
      })
    );
    sw_log('Service worker settings initialized.');
  } catch (err) {
    sw_error_log('Could not initialize service worker settings.');
  }
});
>>>>>>> 32deeab9f3a6c2d08136a588b2e538e01498b2b6

// Listen for fetch events, and for those to the /graphql endpoint,
// run our caching logic, passing in information about the request.
self.addEventListener('fetch', async (fetchEvent) => {
  let metrics = new Metrics();
  const clone = fetchEvent.request.clone();
  const { url, method, headers } = clone;
  const urlObject = new URL(url);
  if (urlObject.pathname.endsWith('/graphql')) {
    async function fetchAndGetResponse() {
      try {
        const body = await getBody(fetchEvent);
        const [queryResult, hashedQuery] = await runCachingLogic(
          urlObject,
          method,
          headers,
          body,
          metrics
        );
        metrics.save(hashedQuery);
        return new Response(JSON.stringify(queryResult), { status: 200 });
      } catch (err) {
        sw_error_log('There was an error in the caching logic!', err.message);
        return await fetch(clone);
      }
    }
    fetchEvent.respondWith(fetchAndGetResponse());
  }
});

// Gets the body from the request and returns it
const getBody = async (e) => {
  const blob = await e.request.blob();
  const body = await blob.text();
  return body;
};

// The main wrapper function for our caching solution
<<<<<<< HEAD
async function runCachingLogic(urlObject, method, headers, body) {
  const query = method === 'GET' ? getQueryFromUrl(urlObject) : body; // added .query
  // added by JR
  // console.log('body.query =', body.query);
  // console.log('query before AST =', query);
  const AST = parse(query); // --> put it once we know it wasn't already done
  console.log('AST of query =', AST);
  console.log('AST.definitions =', AST.definitions);
  console.log('AST from top query =', AST.definitions[0].selectionSet.selections[0]);
  const metadata = extractMetadata(AST);
  console.log(metadata);



  const hashedQuery = hashQuery(query);
=======
async function runCachingLogic(urlObject, method, headers, body, metrics) {
  let query = method === 'GET' ? getQueryFromUrl(urlObject) : body;
  const hashedQuery = hash(query);
>>>>>>> 32deeab9f3a6c2d08136a588b2e538e01498b2b6
  const cachedData = await checkQueryExists(hashedQuery);
  if (cachedData) {
    metrics.isCached = true;
    sw_log('Fetched from cache');
    return [cachedData, hashedQuery];
  } else {
    const data = await executeQuery(urlObject.href, method, headers, body);
    writeToCache(hashedQuery, data);
    return [data, hashedQuery];
  }
}

// If a GET method, we need to pull the query off the url
// and use that instead of the POST body
// EG: 'http://localhost:4000/graphql?query=query\{human(input:\{id:"1"\})\{name\}\}'
function getQueryFromUrl(urlObject) {
  const query = decodeURI(urlObject.searchParams.get('queries', 'query'));
  if (!query)
    throw new Error(`This HTTP GET request is not a valid GQL request: ${url}`);
  return query;
}

<<<<<<< HEAD
// Hash the query and convert to hex string
function hashQuery(clientQuery) {
  //const hashedQuery = MD5(JSON.stringify(clientQuery));
  //return hashedQuery.toString(enc.hex);
  const hashedQuery = ourMD5(JSON.stringify(clientQuery));
  return hashedQuery;
}

=======
>>>>>>> 32deeab9f3a6c2d08136a588b2e538e01498b2b6
// Checks for existence of hashed query in IDB
async function checkQueryExists(hashedQuery) {
  try {
    const val = await get('queries', hashedQuery);
    return val;
  } catch (err) {
    sw_error_log('Error getting query from IDB', err.message);
  }
}

// If the query doesn't exist in the cache, then execute
// the query and return the result.
async function executeQuery(url, method, headers, body) {
  try {
    const options = { method, headers };
    if (method === 'POST') {
      options.body = body;
    }
    const response = await fetch(url, options);
    const data = await response.json();
    return data;
  } catch (err) {
    sw_error_log('Error executing query', err.message);
  }
}

// Write the result into cache
function writeToCache(hash, queryResult) {
  set('queries', hash, queryResult)
    .then(() => sw_log('Wrote response to cache.'))
    .catch((err) =>
      sw_error_log('Could not write response to cache', err.message)
    );
}

<<<<<<< HEAD
// Extracts metadata of query from client
function extractMetadata(AST) {
  //create empty metadata Object 
  //create operationType variable
  //create model variable
  //create argument variable
  //start iterating/searching thorugh the AST object to find relevant properties
  //these relevant properties include: operationType, model, *selection*:
  //selection property of AST object is an array of arrays which will include the fields
  // operationType is available at top level
  // arguments is available at top level
  // model is defined in the very first selection
  //that we need to save in the metadata
  // number of nested selections = query depth level 
  // e.g. selection with 3 fields, 1 of which is another depth would have
  // 0 index = name of field
  // 1 index = name of field
  // 2 index = name of field and another selection
  // return metadata

  let operationType;
  let model;
  let argument;

  const fieldValues = [];

  visit(AST, {
    // enter (node) {

    // },
    OperationDefinition(node) {
      operationType = node.operation;
    },
    // SelectionSet: {
    //   enter (node) {
    //     const arguments = node.selections[0];
    //   }
    // }
    Field: {
      enter (node) {
        // const fieldValues = [];
        fieldValues.push(node.name.value);
      }
    }
  })
  
  model = fieldValues[0];

  return { operationType, model }
  // return { operationType, model, argument }
}

// store this metadata along with the query result into indexDB

//check if top level operation is query, if so invoke caching logic and immediately pass along request
function operationTypeCheck(query)  {
//if string "query" is found before first occurence of curcly brace, then operation type is query
return query.includes('query') && ( query.indexOf('query') < query.indexOf('{') )
  ? console.log('This operation is a query')
  : console.log('This operation is not a query');
}
=======
// Hash a query into a simple string
function hash(str) {
  let i = str.length;
  let hash1 = 5381;
  let hash2 = 52711;
  while (i--) {
    const char = str.charCodeAt(i);
    hash1 = (hash1 * 33) ^ char;
    hash2 = (hash2 * 33) ^ char;
  }
  return (hash1 >>> 0) * 4096 + (hash2 >>> 0);
}
>>>>>>> 32deeab9f3a6c2d08136a588b2e538e01498b2b6
