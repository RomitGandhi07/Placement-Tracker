const {eligibleOpportunities} = require('../../use-cases');
module.exports = function makeApplyOpportunity({ db }) {
    return async function applyOpportunity({ id, data }) {
        const applicantInfo = {
            studentId: data.studentId,
            resumeId: data.resumeId,
            appliedAt: new Date()
        }

        const response = await db.applyOpportunity({ id, data: applicantInfo });
        if(response){
            const result = await getEligibleOpportunities({id: data.studentId, db});
            return result;
        }
        return response;
    }
}

const getEligibleOpportunities = async ({id, db}) =>{
    const student = await db.getStudent({
        id,
        fields: "email stream",
    });

    if (!student) {
        return student;
    }

    let response = await db.getEligibleOpportunities({
        streamId: student.stream,
    });
    response = JSON.stringify(response);
    response = JSON.parse(response);

    if (response && response.length > 0) {
        response.forEach((opportunity) => {
            // Make field for student has applied or not
            const index = opportunity.applicants.findIndex(
                (applicant) => applicant.studentId == id
            );

            if(index == -1){opportunity.applied = false;}
            else{opportunity.applied = true;}

            // Find no of applicants
            opportunity.applicants = opportunity.applicants.length;

            // Find diff between registration last date and today's date
            let diff =
                new Date(opportunity.registrationLastDate) - new Date();
            // If diff is less then 0 then registration ended otherwise it is open
            if (diff < 0) {
                diff = Math.abs(diff);
                // Count no of days between two dates
                const diffDays =
                    Math.ceil(diff / (1000 * 60 * 60 * 24)) - 1;

                // If days are 0 then set message registration ended today otherwise ended x days ago
                if (diffDays == 0) {
                    opportunity.registrationEndMessage = `Registration Ended Today`;
                } else {
                    opportunity.registrationEndMessage = `Registration Ended ${diffDays} Days Ago`;
                }

                opportunity.registrationAllowed = false;
            } else {
                // Count no of days and set message that registration ends in x days
                const diffDays = Math.ceil(diff / (1000 * 60 * 60 * 24));
                if (diffDays == 1) {
                    opportunity.registrationEndMessage = `Registration Ends in ${diffDays} Day`;
                } else {
                    opportunity.registrationEndMessage = `Registration Ends in ${diffDays} Days`;
                }

                opportunity.registrationAllowed = true;
            }
        });
    }
    return response;
}