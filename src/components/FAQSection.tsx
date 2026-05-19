import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { Icon } from "@iconify/react";

const FAQSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      icon: "ph:globe-bold",
      question: "The Card-Membership Revolution: Autonomous. Membership. Invisible.",
      answer: "Onchain is not just an upgrade; it's a paradigm shift. It's the era of the autonomous internet, where cardholders, not just humans, are primary economic actors. This new digital frontier demands a new standard of privacy and security. UCARD is built for this future, enabling confidential commerce where cardholders transact with strategic discretion.",
    },
    {
      icon: "ph:shield-check-bold",
      question: "Encrypted Issuance: The Engine of Confidentiality",
      answer: "At the core of UCARD's privacy infrastructure lies virtual card rails. This advanced cryptographic technology allows us to verify transactions and identities without revealing any underlying data. For the onchain card economy, encrypted issuance are not just about privacy; they're about enabling trustless, verifiable, and completely confidential interactions between cardholders.",
    },
    {
      icon: "ph:lightning-bold",
      question: "Card-Issuance Protocol: The Native Standard for Autonomous Commerce",
      answer: "The card-issuance protocol is more than just a payment standard; it's the internet-native language for the onchain card economy. By implementing HTTP 402 ('Payment Required'), card-issuance enables seamless, machine-to-machine value exchange. UCARD integrates card-issuance to ensure that your cardholders can autonomously and confidentially interact with services and other agents, making payments a frictionless part of the autonomous web.",
    },
    {
      icon: "ph:lock-bold",
      question: "Your Privacy, Our Protocol: How UCARD Secures Your Data",
      answer: "UCARD is engineered from the ground up to be the most secure and private card wallet on Ethereum. We leverage advanced virtual card rails and encrypted card-issuance to encrypt your transaction amounts, balances, and even the links to your main wallet. This means your financial activity remains completely confidential, even from us. Your data, your control, always invisible.",
    },
    {
      icon: "ph:robot-bold",
      question: "AI Agents: Autonomy Meets Confidentiality",
      answer: "Absolutely. UCARD is purpose-built for the burgeoning membership economy. Our platform empowers cardholders to operate with full autonomy, making and receiving payments, interacting with protocols, and executing complex strategies — all while maintaining complete financial confidentiality. With UCARD, your cardholders gain the strategic advantage of privacy, ensuring their operations remain secure and untraceable on Ethereum.",
    },
    {
      icon: "ph:question-bold",
      question: "Built on Ethereum: The Secure Foundation for Onchain Finance",
      answer: "UCARD proudly operates on Ethereum, Ethereum mainnet. This strategic choice provides our users and cardholders with unparalleled transaction speed, minimal fees, and the robust security of the Ethereum network. By leveraging Base, UCARD ensures that confidential payments for the onchain card economy are not only private but also efficient, scalable, and future-proof.",
    },
  ];

  return (
    <section ref={ref} id="faq" className="bg-secondary/30 border-t border-border">
      <div className="max-w-[1400px] mx-auto px-8 py-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <span className="tag-pill">FAQ</span>
        </motion.div>

        <div className="grid md:grid-cols-12 gap-10 mb-16">
          <motion.div
            className="md:col-span-7"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
          <h2 className="display-section font-serif text-foreground">
              Deep Dive into{" "}
              <em className="gradient-text" style={{ background: 'var(--gradient-beam)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>UCARD</em>
            </h2>
          </motion.div>
        </div>

        <div className="divide-y divide-border">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 + index * 0.08 }}
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full py-8 flex items-start gap-6 text-left group exp-row"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors duration-300 ${
                  openIndex === index ? "bg-foreground text-background" : "bg-secondary text-muted-foreground"
                }`}>
                  <Icon icon={faq.icon} className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className={`text-lg font-semibold transition-colors ${
                    openIndex === index ? "text-foreground" : "text-muted-foreground"
                  }`}>
                    {faq.question}
                  </h3>
                  <motion.div
                    initial={false}
                    animate={{
                      height: openIndex === index ? "auto" : 0,
                      opacity: openIndex === index ? 1 : 0,
                    }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <p className="text-muted-foreground text-sm leading-relaxed mt-4 max-w-2xl">
                      {faq.answer}
                    </p>
                  </motion.div>
                </div>
                <motion.div
                  animate={{ rotate: openIndex === index ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex-shrink-0 mt-1"
                >
                  <Icon icon="ph:caret-down-bold" className={`w-5 h-5 transition-colors ${openIndex === index ? "text-foreground" : "text-muted-foreground/30"}`} />
                </motion.div>
              </button>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-12"
        >
           <p className="text-muted-foreground/60 text-sm">
             Still have questions? Reach out to us on{" "}
             <a href="https://x.com/uCards_" target="_blank" rel="noopener noreferrer" className="text-foreground hover:underline">
               Twitter
             </a>
           </p>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQSection;
