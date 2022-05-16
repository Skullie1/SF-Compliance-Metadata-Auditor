# Salesforce Data Classification App: Install Steps

What features does this provide?
<l>

  <li>Audit on Org’s metadata Security Classification</li>
 <li>Ability to export to csv format</li>
 <li>Ability to target specific entities in report.</li>
 <li>Ability to target new fields added to org based on time frame.</li>
 <li>Ability to omit fields from report if no classification is required.</li>
</l>
<br>
<l>
  <li>Deploy manifest from repo <a href="https://githubsfdeploy.herokuapp.com">
  <img alt="Deploy to Salesforce"
       src="https://raw.githubusercontent.com/afawcett/githubsfdeploy/master/deploy.png">
</a></li>
  <li>Add permission set Data_Classification_App to user</li>
  <li>In App launcher, navigate to Data Classification Analytics</li>
  <li>Ensure info on data classisfication input tab is set up</li>
  <li>Navigate to data classification report tab and let report load</li>
  <li>Note the longer loadtime for more entities in report</li>
</l>
  <br>

New Connected App

1. Go to Setup > Apps > App Manager

2. Click on New Connected App button

3. Provide a Name, say DataClass_CApp . Add a contact email

4. Select Enable oAuth Setting checkbox

5. Give a Dummy URl for now. We'll update this in just a while

6. Select the 'full' and 'refresh_token' oAuth scopes

7. Save the Connected App

New Auth Provider

1. Go to Setup > Identity > Auth. Providers

2. Click on New button

3. Select Salesforce

4. Provide a Name, say DataClass_AuthProv

5. Copy the Consumer Key and Consumer Secret from new Connected App and paste the Consumer Key and Consumer Secret

6. Add Default Scope as 'refresh_token full'

7. Save the Auth Provider

8. Copy the Callback URL from the Salesforce Configuration section

Update Connected App

1. Edit the Connected App, and paste the Callback URl just copied from Auth Provider

New Named Credential 0. Wait for 10 minutes for the Connected App information to flow to servers, before taking the next steps

1. Go to Setup > Security > Named Credentials.

2. Click New Named Credential

3. Enter Label and Name as 'DataClass_NC'

4. Enter the My Domain URL in URL field. Your My Domain can be found in Setup > Company Settings > My Domain

5. Select the Identity Type as 'Named Principal'

6. Select the Authentication Protocol as OAuth 2.0

7. Select the Auth Provider we created in previous step

8. Add Scope as 'refresh_token full'

9. Select 'Start Authentication Flow on Save' and click Save

10. Saving the Named Credential will start an Authentication Flow for this Org. Login once as a SYSTEM ADMIN
    <br/>

![Screen Shot 2022-02-14 at 1 38 39 PM](https://user-images.githubusercontent.com/83821286/153934497-b84300f4-c1d3-41ce-ac04-bb322e138090.png)
![Screen Shot 2022-02-14 at 1 19 05 PM](https://user-images.githubusercontent.com/83821286/153931360-636fc543-e869-4323-a110-33d1c9ed9642.png)
![image](https://user-images.githubusercontent.com/83821286/154959257-53fa7f5d-8112-4737-bc9d-2ce27bd8d608.png)
