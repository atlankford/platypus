platypus - the snapchat of real-time geolocation
========

//Todo
-add indexed db to store user info
-fix infobox on update
-add gravitar to infobox
-add icon selection prior to broadcast
-fix google ads
-fix getlocation callbacks and promises

-*launch*
-----------------------------------------------------------------------------------------------------------

PLAT Pseudocode

	||  KEY  ||
	?  represents a question for routing algorithm.  Usually an if conditional
	-  response to if conditional
	() function or method 
	*  represents user action.  typically a start or stop.  Can be system action like 	 display a button
	
\
USER POINT OF ENTRY
?Is user here to follow or are they here to view the map?
	-user is here to follow
		get data record of followee
			?Is there an active record for the followee?
				-yes
					()initiaize map based on followee location
					()load map listeners based on followee's location
					()set map refresh to update based on followee's location
						?Did the followee stop broadcasting?
							-yes
								()alert user that followee stopped broadcasting
								()reset init method with clean url
							-no
								()contiue to refresh map until users stops following
						*the user stop following
								()reset init method with clean url
				-no
					()alert user that followee is no longer active
					()reset init method with clean url							
	-user is her to view the map
		?does user have plat db?
			-yes
				()set returning user boolean to true
				()get last unique id
				()get last known location
				()initialize map based on last know location
				()load map listeners based on last known location
				()get users current location
				()initialize map based on last know location
				()load map listeners based on last known location
			-no
				()get users current location
					->then initialize map based on posit
					()load map listeners based on posit
	    *user starts broadcast
	    	?Is user returning?
	    		-yes
	    			()get last unique id and set as current id
	    			*launch broadcast setup
	    				()get temp plat handle
	    				()get plat info from user
	    				()get icon image from user
	    				*confirm broadcast
	    					()add location to database
	    					()update indexedDB info
	    						*create share info
	    	    -no
	    	    	()create indexedDB in browser
	    	    	()create uniqueID	
	    	    		*launch broadcast setup
	    				()get temp plat handle
	    				()get plat info from user
	    				()get icon image from user
	    				*confirm broadcast
	    					()add location to database
	    					()update indexedDB info
	    						*create share info
	    *user stops broadcast
	    	    	






				



