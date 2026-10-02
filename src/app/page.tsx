import Operations from "@/components/operations";
import { Provider } from "@/components/store";
export default function Page() {
  return (
    <Provider>
      <Operations />
    </Provider>
  );
}
